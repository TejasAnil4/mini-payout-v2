const express = require("express");
const router = express.Router();

const payoutController = require("../controllers/payout.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");
const { validate } = require("../middlewares/validate.middleware");
const { createPayoutSchema } = require("../validators/payout.validator");

/**
 * @swagger
 * tags:
 *   name: Payout
 *   description: Money movement from merchant wallet to beneficiaries
 */

/**
 * @swagger
 * /api/v1/payout:
 *   post:
 *     summary: Create a payout to a verified beneficiary (merchant only)
 *     description: |
 *       Sends money from the merchant's wallet to a beneficiary. Everything happens in one atomic database transaction:
 *
 *       1. **Debit** the merchant's wallet using optimistic locking (version check)
 *       2. **If INTERNAL_WALLET beneficiary:** credit the recipient's wallet
 *       3. **Create** a Transaction ledger entry (type PAYOUT, status SUCCESS)
 *
 *       If any step fails, all three are rolled back.
 *
 *       **Idempotency:** send an `idempotencyKey` (any unique string) to protect against accidental duplicates. Retries with the same key return the original transaction without moving money again.
 *     tags: [Payout]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [beneficiaryId, amount]
 *             properties:
 *               beneficiaryId:
 *                 type: string
 *                 example: 49152095-6507-478d-aaf8-667d9d4612a4
 *                 description: UUID of a verified beneficiary owned by the merchant
 *               amount:
 *                 type: number
 *                 example: 1500
 *               idempotencyKey:
 *                 type: string
 *                 example: neymar-payout-001
 *                 description: Optional but recommended. A unique key per intended payout.
 *     responses:
 *       201:
 *         description: Payout succeeded. Returns the Transaction ledger row.
 *       400:
 *         description: Validation error, unverified beneficiary, insufficient balance, or wallet was concurrently modified
 *       401:
 *         description: No token or invalid token
 *       403:
 *         description: Not a merchant
 */
router.post("/", protect, authorize("MERCHANT"), validate(createPayoutSchema), payoutController.createPayout);

/**
 * @swagger
 * /api/v1/payout/my:
 *   get:
 *     summary: List my sent payouts (merchant only)
 *     tags: [Payout]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of payout transactions, newest first
 *       401:
 *         description: No token or invalid token
 *       403:
 *         description: Not a merchant
 */
router.get("/my", protect, authorize("MERCHANT"), payoutController.getMyPayouts);

/**
 * @swagger
 * /api/v1/payout/all:
 *   get:
 *     summary: List all payouts across the platform (admin only)
 *     description: Supports optional filters via query parameters.
 *     tags: [Payout]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, SUCCESS, FAILED]
 *         description: Filter by transaction status
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by merchant's user id
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: ISO date; return payouts on or after this date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: ISO date; return payouts on or before this date
 *     responses:
 *       200:
 *         description: Filtered array of payout transactions with merchant info nested
 *       401:
 *         description: No token or invalid token
 *       403:
 *         description: Not an admin
 */
router.get("/all", protect, authorize("ADMIN"), payoutController.getAllPayouts);

module.exports = router;