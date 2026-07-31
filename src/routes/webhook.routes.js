// src/routes/webhook.routes.js
const express = require("express");
const router = express.Router();

const webhookController = require("../controllers/webhook.controller");
const { verifyWebhookSignature } = require("../middlewares/verifyWebhookSignature.middleware");

/**
 * @swagger
 * tags:
 *   name: Webhooks
 *   description: Incoming webhooks from external systems (simulated bank)
 */

/**
 * @swagger
 * /api/v1/webhooks/bank-transfer:
 *   post:
 *     summary: Simulated bank webhook — notifies that a bank transfer completed
 *     description: |
 *       Requires a valid HMAC-SHA256 signature in the `X-Webhook-Signature` header,
 *       computed over the raw JSON body using the shared WEBHOOK_SECRET.
 *     tags: [Webhooks]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [referenceId, amount, accountNumber]
 *             properties:
 *               referenceId:
 *                 type: string
 *                 example: BANK-TXN-98765
 *               amount:
 *                 type: number
 *                 example: 3000
 *               accountNumber:
 *                 type: string
 *                 example: "1234567890"
 *     responses:
 *       200:
 *         description: Webhook processed, matching topup approved
 *       401:
 *         description: Missing or invalid webhook signature
 *       404:
 *         description: No matching channel or pending topup found
 */
router.post("/bank-transfer", verifyWebhookSignature, webhookController.handleBankTransfer);

module.exports = router;