const prisma = require("../config/db");
const topupService = require("./topup.service");
const { NotFoundError } = require("../utils/errors");

const handleBankTransferWebhook = async (payload) => {
  const { referenceId, amount, accountNumber } = payload;

  // Find the channel that matches this bank account
  const channel = await prisma.channel.findFirst({
    where: { accountNumber, status: "VERIFIED" },
  });

  if (!channel) {
    throw new NotFoundError("No verified channel found for this account number");
  }

  // Find a matching PENDING topup request for this channel's owner, with this exact amount
  const topup = await prisma.topUpRequest.findFirst({
    where: {
      userId: channel.userId,
      amount: amount,
      status: "PENDING",
    },
    orderBy: { createdAt: "asc" },   // oldest matching pending request first
  });

  if (!topup) {
    throw new NotFoundError("No matching pending top-up request found");
  }

  // Reuse the EXACT SAME atomic approval logic you already built and tested
  const result = await topupService.approveTopUp(topup.id);

  return result;
};

module.exports = { handleBankTransferWebhook };