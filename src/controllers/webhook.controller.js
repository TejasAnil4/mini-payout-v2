// src/controllers/webhook.controller.js
const webhookService = require("../services/webhook.service");
const { asyncHandler } = require("../utils/asyncHandler");

const handleBankTransfer = asyncHandler(async (req, res) => {
  const result = await webhookService.handleBankTransferWebhook(req.body);
  res.status(200).json({
    success: true,
    message: "Webhook processed successfully",
    data: result,
  });
});

module.exports = { handleBankTransfer };