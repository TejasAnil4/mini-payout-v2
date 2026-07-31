const topupService = require("../services/topup.service");
const { asyncHandler } = require("../utils/asyncHandler");

const createTopUp = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const topup = await topupService.createTopUp(userId, req.body);
  res.status(201).json({
    success: true,
    message: "Top-up request created (pending admin approval)",
    data: topup,
  });
});

const getMyTopUps = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const topups = await topupService.getMyTopUps(userId);
  res.status(200).json({
    success: true,
    message: "Top-up requests fetched",
    data: topups,
  });
});

const getPendingTopUps = asyncHandler(async (req, res) => {
  const topups = await topupService.getPendingTopUps();
  res.status(200).json({
    success: true,
    message: "Pending top-up requests fetched",
    data: topups,
  });
});

const approveTopUp = asyncHandler(async (req, res) => {
  const topupId = req.params.id;
  const result = await topupService.approveTopUp(topupId);
  res.status(200).json({
    success: true,
    message: "Top-up approved successfully",
    data: result,
  });
});

module.exports = {
  createTopUp,
  getMyTopUps,
  getPendingTopUps,
  approveTopUp,
};