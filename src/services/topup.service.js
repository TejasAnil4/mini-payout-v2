const prisma = require("../config/db");
const { BadRequestError, NotFoundError, ConflictError } = require("../utils/errors");
const { notifyUser } = require("../utils/notify");
const { deleteCache } = require("../utils/cache");
const { logAction } = require("../utils/auditLog");

// Merchant: create a top-up request
const createTopUp = async (userId, data) => {
  const { amount } = data;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      selectedChannel: true,
      wallet: true,
    },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (!user.selectedChannel) {
    throw new BadRequestError("No channel selected. Please select a verified channel first.");
  }

  if (user.selectedChannel.status !== "VERIFIED") {
    throw new BadRequestError("Selected channel is not verified");
  }

  if (!user.wallet) {
    throw new NotFoundError("Wallet not found");
  }

  const topup = await prisma.topUpRequest.create({
    data: {
      userId,
      walletId: user.wallet.id,
      amount,
    },
  });

  await logAction({
  userId,
  action: "TOPUP_REQUESTED",
  entityType: "TopUpRequest",
  entityId: topup.id,
  metadata: { amount: topup.amount },
});

  return topup;
};

// Merchant: list their own top-up requests
const getMyTopUps = async (userId) => {
  const topups = await prisma.topUpRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return topups;
};

// Admin: list all pending top-up requests
const getPendingTopUps = async () => {
  const topups = await prisma.topUpRequest.findMany({
    where: { status: "PENDING" },
    include: {
      user: {
        select: { id: true, email: true, fullName: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return topups;
};

// Admin: approve a top-up
const approveTopUp = async (topupId,approverId = null) => {
  const topup = await prisma.topUpRequest.findUnique({
    where: { id: topupId },
    include: { wallet: true },
  });

  if (!topup) {
    throw new NotFoundError("Top-up request not found");
  }

  if (topup.status !== "PENDING") {
    throw new ConflictError(`Top-up is already ${topup.status.toLowerCase()}`);
  }

  if (topup.wallet.status !== "ACTIVE") {
    throw new BadRequestError("Wallet is not active");
  }

  // ── Everything below is UNCHANGED — the atomic transaction stays exactly as it was ──
  const result = await prisma.$transaction(async (tx) => {
    const updatedWallet = await tx.wallet.update({
      where: { id: topup.walletId },
      data: {
        balance: { increment: topup.amount },
      },
    });

    const updatedTopup = await tx.topUpRequest.update({
      where: { id: topupId },
      data: { status: "APPROVED" },
    });

    const transaction = await tx.transaction.create({
      data: {
        referenceId: `TXN-${Date.now()}-${topupId.slice(0, 8)}`,
        userId: topup.userId,
        walletId: topup.walletId,
        transactionType: "WALLET_TOPUP",
        amount: topup.amount,
        fees: 0,
        netAmount: topup.amount,
        status: "SUCCESS",
        remarks: `Top-up approved (request id: ${topupId})`,
      },
    });

    return { updatedWallet, updatedTopup, transaction };
  });

  await deleteCache(`wallet:${topup.userId}`);

  await logAction({
    userId: approverId,   // null if triggered by webhook, admin's id if manual
    action: "TOPUP_APPROVED",
    entityType: "TopUpRequest",
    entityId: topupId,
    metadata: {
      amount: topup.amount,
      approvedBy: approverId ? "admin" : "webhook",
    },
  });

  notifyUser(topup.userId, "topup_approved",
     {
  message: `Your top-up of ₹${topup.amount} has been approved!`,
  transactionId: result.transaction.id,
  newBalance: result.updatedWallet.balance,
});



  return result;
};

module.exports = {
  createTopUp,
  getMyTopUps,
  getPendingTopUps,
  approveTopUp,
};