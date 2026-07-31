const express = require("express");
const router = express.Router();

const topupController = require("../controllers/topup.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");

const { validate } = require("../middlewares/validate.middleware");
const { createTopupSchema } = require("../validators/topup.validator");

/**
 * @swagger
 * tags:
 *   name: TopUp
 *   description: Wallet funding via topup requests
 */

/**
 * @swagger
 * /api/v1/topup/request:
 *   post:
 *     summary: Create a topup request (merchant only)
 *     description: Merchant requests to fund their wallet. Wallet balance is NOT credited yet — an admin must approve first. Requires the merchant to have a verified selected channel.
 *     tags: [TopUp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 3000
 *                 description: Amount in the currency's smallest unit (rupees)
 *     responses:
 *       201:
 *         description: Topup request created with status PENDING
 *       400:
 *         description: Invalid amount, no verified channel selected, or wallet not found
 *       401:
 *         description: No token or invalid token
 *       403:
 *         description: Not a merchant
 */
router.post("/request", protect, authorize("MERCHANT"), validate(createTopupSchema),topupController.createTopUp);

/**
 * @swagger
 * /api/v1/topup/my:
 *   get:
 *     summary: List my topup requests (merchant only)
 *     tags: [TopUp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of the merchant's topup requests, newest first
 *       401:
 *         description: No token or invalid token
 *       403:
 *         description: Not a merchant
 */
router.get("/my", protect, authorize("MERCHANT"), topupController.getMyTopUps);

/**
 * @swagger
 * /api/v1/topup/pending:
 *   get:
 *     summary: List all pending topup requests (admin only)
 *     tags: [TopUp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of pending topups with merchant info
 *       401:
 *         description: No token or invalid token
 *       403:
 *         description: Not an admin
 */
router.get("/pending", protect, authorize("ADMIN"), validate(createTopupSchema), topupController.getPendingTopUps);

/**
 * @swagger
 * /api/v1/topup/{id}/approve:
 *   patch:
 *     summary: Approve a pending topup (admin only)
 *     description: |
 *       Atomically performs three writes in a single database transaction:
 *       1. Credits the merchant's wallet balance
 *       2. Marks the topup as APPROVED
 *       3. Creates a Transaction ledger entry (type WALLET_TOPUP, status SUCCESS)
 *
 *       If any step fails, all three are rolled back.
 *     tags: [TopUp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The topup request's UUID
 *     responses:
 *       200:
 *         description: Approved. Response contains updated wallet, updated topup, and the new Transaction row.
 *       400:
 *         description: Topup not found, already processed, or wallet not active
 *       401:
 *         description: No token or invalid token
 *       403:
 *         description: Not an admin
 */
router.patch("/:id/approve", protect, authorize("ADMIN"), topupController.approveTopUp);

module.exports = router;