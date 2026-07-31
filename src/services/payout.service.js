const prisma = require("../config/db");
const { BadRequestError, NotFoundError, ConflictError } = require("../utils/errors");
const { payoutNotificationQueue } = require("../queues/payoutNotification.queue");
const { notifyUser } = require("../utils/notify");

const createPayout = async (merchantId, data) => {
  const { beneficiaryId, amount, idempotencyKey } = data;



  const payoutAmount = amount;

  // ── Idempotency check ──
  if (idempotencyKey) {
    const existing = await prisma.transaction.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      if (existing.userId === merchantId) {
        return existing;
      }
      throw new ConflictError("Idempotency key conflict");
    }
  }

  // ── Beneficiary validation ──
  const beneficiary = await prisma.beneficiary.findFirst({
    where: {
      id: beneficiaryId,
      merchantId,
      status: "VERIFIED",
    },
    include: {
      linkedUser: {
        include: { wallet: true },
      },
    },
  });

  if (!beneficiary) {
    throw new BadRequestError("Beneficiary not found, not yours, or not yet verified");
  }

  if (beneficiary.type === "INTERNAL_WALLET") {
    if (!beneficiary.linkedUser) {
      throw new NotFoundError("Linked user no longer exists");
    }
    if (!beneficiary.linkedUser.wallet) {
      throw new NotFoundError("Linked user has no wallet");
    }
    if (beneficiary.linkedUser.wallet.status !== "ACTIVE") {
      throw new BadRequestError("Linked user's wallet is not active");
    }
  }

  // ── Merchant wallet validation ──
  const merchantWallet = await prisma.wallet.findUnique({
    where: { userId: merchantId },
  });

  if (!merchantWallet) {
    throw new NotFoundError("Merchant wallet not found");
  }
  if (merchantWallet.status !== "ACTIVE") {
    throw new BadRequestError("Merchant wallet is not active");
  }
  if (Number(merchantWallet.balance) < payoutAmount) {
    throw new BadRequestError("Insufficient wallet balance");
  }

  const walletVersion = merchantWallet.version;

  // ── EVERYTHING BELOW IS UNCHANGED — the atomic transaction stays exactly as it was ──
  const result = await prisma.$transaction(async (tx) => {
    const debitResult = await tx.wallet.updateMany({
      where: {
        id: merchantWallet.id,
        version: walletVersion,
      },
      data: {
        balance: { decrement: payoutAmount },
        version: { increment: 1 },
      },
    });

    if (debitResult.count === 0) {
      throw new ConflictError("Wallet was modified by another operation. Please retry.");
    }

    if (beneficiary.type === "INTERNAL_WALLET") {
      await tx.wallet.update({
        where: { id: beneficiary.linkedUser.wallet.id },
        data: {
          balance: { increment: payoutAmount },
          version: { increment: 1 },
        },
      });
    }

    const transaction = await tx.transaction.create({
      data: {
        referenceId: `PAY-${Date.now()}-${beneficiaryId.slice(0, 8)}`,
        idempotencyKey: idempotencyKey || null,
        userId: merchantId,
        walletId: merchantWallet.id,
        transactionType: "PAYOUT",
        amount: payoutAmount,
        fees: 0,
        netAmount: payoutAmount,
        status: "SUCCESS",
        remarks: `Payout to ${beneficiary.beneficiaryName} (${beneficiary.type})`,
      },
    });

    return transaction;
  });

  await payoutNotificationQueue.add("send-payout-notification", {
  transactionId: result.id,
  merchantId,
  amount: payoutAmount,
});

notifyUser(merchantId, "payout_completed", {
  message: `Your payout of ₹${payoutAmount} to ${beneficiary.beneficiaryName} was successful!`,
  transactionId: result.id,
});

  return result;
};

const getMyPayouts = async (merchantId) => {
  const payouts = await prisma.transaction.findMany({
    where: {
      userId: merchantId,
      transactionType: "PAYOUT",
    },
    orderBy: { createdAt: "desc" },
  });
  return payouts;
};

const getAllPayouts = async (filters) => {
  const { status, userId, fromDate, toDate } = filters;

  const where = { transactionType: "PAYOUT" };
  if (status) where.status = status;
  if (userId) where.userId = userId;

  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = new Date(fromDate);
    if (toDate) where.createdAt.lte = new Date(toDate);
  }

  const payouts = await prisma.transaction.findMany({
    where,
    include: {
      user: {
        select: { id: true, email: true, fullName: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return payouts;
};

module.exports = {
  createPayout,
  getMyPayouts,
  getAllPayouts,
};