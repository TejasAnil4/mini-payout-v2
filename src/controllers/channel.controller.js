const channelService = require("../services/channel.service");
const { asyncHandler } = require("../utils/asyncHandler");

const addChannel = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const channel = await channelService.addChannel(userId, req.body);
  res.status(201).json({
    success: true,
    message: "Channel added successfully (pending verification)",
    data: channel,
  });
});

const getMyChannels = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const channels = await channelService.getMyChannels(userId);
  res.status(200).json({
    success: true,
    message: "Channels fetched successfully",
    data: channels,
  });
});

const selectChannel = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const channelId = req.params.id;
  const result = await channelService.selectChannel(userId, channelId);
  res.status(200).json({
    success: true,
    message: "Channel selected as active",
    data: result,
  });
});

const getPendingChannels = asyncHandler(async (req, res) => {
  const channels = await channelService.getPendingChannels();
  res.status(200).json({
    success: true,
    message: "Pending channels fetched",
    data: channels,
  });
});

const verifyChannel = asyncHandler(async (req, res) => {
  const channelId = req.params.id;
  const channel = await channelService.verifyChannel(channelId);
  res.status(200).json({
    success: true,
    message: "Channel verified",
    data: channel,
  });
});

module.exports = {
  addChannel,
  getMyChannels,
  selectChannel,
  getPendingChannels,
  verifyChannel,
};