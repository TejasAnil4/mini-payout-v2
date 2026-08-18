const prisma = require("../config/db");
const { ConflictError, NotFoundError, BadRequestError } = require("../utils/errors");
const { logAction } = require("../utils/auditLog");

// Merchant adds a new channel
const addChannel = async (userId, data) => {
  const { bankName, accountHolderName, accountNumber, ifscCode } = data;

  const existing = await prisma.channel.findFirst({
    where: { ifscCode, accountNumber },
  });

  if (existing) {
    throw new ConflictError("A channel with this account already exists");
  }

  const channel = await prisma.channel.create({
    data: {
      userId,
      bankName,
      accountHolderName,
      accountNumber,
      ifscCode,
    },
  });

  await logAction({
  userId,
  action: "CHANNEL_ADDED",
  entityType: "Channel",
  entityId: channel.id,
  metadata: { bankName: channel.bankName, accountNumber: channel.accountNumber },
});

  return channel;
};

// Merchant lists their own channels
const getMyChannels = async (userId) => {
  const channels = await prisma.channel.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return channels;
};

// Merchant selects a verified channel as active
const selectChannel = async (userId, channelId) => {
  const channel = await prisma.channel.findFirst({
    where: {
      id: channelId,
      userId,
      status: "VERIFIED",
    },
  });

  if (!channel) {
    throw new BadRequestError("Channel not found, not yours, or not yet verified");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { selectedChannelId: channel.id },
    select: {
      id: true,
      email: true,
      selectedChannelId: true,
    },
  });

  return updatedUser;
};

// Admin lists all pending channels
const getPendingChannels = async () => {
  const channels = await prisma.channel.findMany({
    where: { status: "PENDING" },
    include: {
      user: {
        select: { id: true, email: true, fullName: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return channels;
};

// Admin verifies a pending channel
const verifyChannel = async (channelId, adminId) => {
  const channel = await prisma.channel.findUnique({ where: { id: channelId } });

  if (!channel) {
    throw new NotFoundError("Channel not found");
  }

  if (channel.status === "VERIFIED") {
    throw new ConflictError("Channel is already verified");
  }

  const updated = await prisma.channel.update({
    where: { id: channelId },
    data: { status: "VERIFIED" },
  });

  await logAction({
    userId: adminId,
    action: "CHANNEL_VERIFIED",
    entityType: "Channel",
    entityId: channelId,
    metadata: { bankName: updated.bankName },
  });

  return updated;
};

module.exports = {
  addChannel,
  getMyChannels,
  selectChannel,
  getPendingChannels,
  verifyChannel,
};