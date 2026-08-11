const payoutService = require("../services/payout.service");
const { asyncHandler } = require("../utils/asyncHandler");

const createPayout = asyncHandler(async (req, res) => {
  const merchantId = req.user.id;
  const payout = await payoutService.createPayout(merchantId, req.body);
  res.status(201).json({
    success: true,
    message: "Payout created successfully",
    data: payout,
  });
});

const getMyPayouts = asyncHandler(async (req, res) => {
  const merchantId = req.user.id;
  const payouts = await payoutService.getMyPayouts(merchantId);
  res.status(200).json({
    success: true,
    message: "Payouts fetched",
    data: payouts,
  });
});

const getAllPayouts = asyncHandler(async (req, res) => {
  const filters = {
    status: req.query.status,
    userId: req.query.userId,
    fromDate: req.query.fromDate,
    toDate: req.query.toDate,
    cursor: req.query.cursor,
    limit: req.query.limit
  };
  const result = await payoutService.getAllPayouts(filters);
  res.status(200).json({
    success: true,
    message: "All payouts fetched",
    data: result.data,
    nextCursor: result.nextCursor,
  });
});

module.exports = {
  createPayout,
  getMyPayouts,
  getAllPayouts,
};