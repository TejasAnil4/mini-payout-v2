const express = require("express");
const router = express.Router();

const channelController = require("../controllers/channel.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");

const { validate } = require("../middlewares/validate.middleware");
const { addChannelSchema } = require("../validators/channel.validator")

/**
 * @swagger
 * tags:
 *   name: Channel
 *   description: Bank channels for wallet funding
 */

/**
 * @swagger
 * /api/v1/channel:
 *   post:
 *     summary: Add a new bank channel (merchant only)
 *     tags: [Channel]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bankName, accountHolderName, accountNumber, ifscCode]
 *             properties:
 *               bankName:
 *                 type: string
 *                 example: HDFC Bank
 *               accountHolderName:
 *                 type: string
 *                 example: Merchant One
 *               accountNumber:
 *                 type: string
 *                 example: "1234567890"
 *               ifscCode:
 *                 type: string
 *                 example: HDFC0001234
 *     responses:
 *       201:
 *         description: Channel added, status PENDING (awaits admin verification)
 *       400:
 *         description: Duplicate account or validation error
 *       401:
 *         description: No token or invalid token
 *       403:
 *         description: Not a merchant
 */
router.post("/", protect, authorize("MERCHANT"), validate(addChannelSchema), channelController.addChannel);

/**
 * @swagger
 * /api/v1/channel/my:
 *   get:
 *     summary: List my own channels (merchant only)
 *     tags: [Channel]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of the merchant's channels
 *       401:
 *         description: No token or invalid token
 *       403:
 *         description: Not a merchant
 */
router.get("/my", protect, authorize("MERCHANT") , validate(addChannelSchema), channelController.getMyChannels);

/**
 * @swagger
 * /api/v1/channel/{id}/select:
 *   patch:
 *     summary: Select a verified channel as active (merchant only)
 *     tags: [Channel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The channel's UUID
 *     responses:
 *       200:
 *         description: Channel selected as merchant's active channel
 *       400:
 *         description: Channel not found, not yours, or not verified
 *       401:
 *         description: No token or invalid token
 *       403:
 *         description: Not a merchant
 */
router.patch("/:id/select", protect, authorize("MERCHANT"), validate(addChannelSchema), channelController.selectChannel);

/**
 * @swagger
 * /api/v1/channel/pending:
 *   get:
 *     summary: List all pending channels across the platform (admin only)
 *     tags: [Channel]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of pending channels with merchant info
 *       401:
 *         description: No token or invalid token
 *       403:
 *         description: Not an admin
 */
router.get("/pending", protect, authorize("ADMIN"), validate(addChannelSchema), channelController.getPendingChannels);

/**
 * @swagger
 * /api/v1/channel/{id}/verify:
 *   patch:
 *     summary: Verify a pending channel (admin only)
 *     tags: [Channel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The channel's UUID
 *     responses:
 *       200:
 *         description: Channel status changed to VERIFIED
 *       400:
 *         description: Channel not found or already verified
 *       401:
 *         description: No token or invalid token
 *       403:
 *         description: Not an admin
 */
router.patch("/:id/verify", protect, authorize("ADMIN"), validate(addChannelSchema), channelController.verifyChannel);

module.exports = router;