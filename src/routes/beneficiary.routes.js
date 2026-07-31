const express = require("express");
const router = express.Router();

const beneficiaryController = require("../controllers/beneficiary.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");

const { validate } = require("../middlewares/validate.middleware");
const { addBeneficiarySchema } = require("../validators/beneficiary.validator");

/**
 * @swagger
 * tags:
 *   name: Beneficiary
 *   description: Merchant's payees (bank accounts or internal users)
 */

/**
 * @swagger
 * /api/v1/beneficiary:
 *   post:
 *     summary: Add a new beneficiary (merchant only)
 *     description: |
 *       Merchant adds someone they want to pay out to. Two types supported:
 *       - *BANK* — external bank account. Requires `accountHolderName`, `accountNumber`, `ifscCode`, `bankName`
 * 
 *       - INTERNAL_WALLET — another user on the platform. Requires `linkedUserId` (must be a MERCHANT, cannot be self)
 *
 *       Beneficiary is created with status PENDING and requires admin verification before payouts can be sent.
 *     tags: [Beneficiary]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, beneficiaryName]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [BANK, INTERNAL_WALLET]
 *                 example: BANK
 *               beneficiaryName:
 *                 type: string
 *                 example: John Doe
 *               accountHolderName:
 *                 type: string
 *                 example: John Doe
 *                 description: Required if type is BANK
 *               accountNumber:
 *                 type: string
 *                 example: "9988776655"
 *                 description: Required if type is BANK
 *               ifscCode:
 *                 type: string
 *                 example: SBIN0001234
 *                 description: Required if type is BANK
 *               bankName:
 *                 type: string
 *                 example: State Bank of India
 *                 description: Required if type is BANK
 *               linkedUserId:
 *                 type: string
 *                 example: ea3666c7-7ef1-4d09-81db-ea61dc5138e1
 *                 description: Required if type is INTERNAL_WALLET
 *     responses:
 *       201:
 *         description: Beneficiary added with status PENDING
 *       400:
 *         description: Validation error (missing type-specific fields, adding self, adding admin, etc.)
 *       401:
 *         description: No token or invalid token
 *       403:
 *         description: Not a merchant
 */
router.post("/", protect, authorize("MERCHANT"), validate(addBeneficiarySchema), beneficiaryController.addBeneficiary);

/**
 * @swagger
 * /api/v1/beneficiary/my:
 *   get:
 *     summary: List my beneficiaries (merchant only)
 *     tags: [Beneficiary]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of the merchant's beneficiaries. Internal beneficiaries include linkedUser info.
 *       401:
 *         description: No token or invalid token
 *       403:
 *         description: Not a merchant
 */
router.get("/my", protect, authorize("MERCHANT"), beneficiaryController.getMyBeneficiaries);

/**
 * @swagger
 * /api/v1/beneficiary/pending:
 *   get:
 *     summary: List all pending beneficiaries across platform (admin only)
 *     tags: [Beneficiary]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of pending beneficiaries with merchant and (for internal) linkedUser info
 *       401:
 *         description: No token or invalid token
 *       403:
 *         description: Not an admin
 */
router.get("/pending", protect, authorize("ADMIN"), beneficiaryController.getPendingBeneficiaries);

/**
 * @swagger
 * /api/v1/beneficiary/{id}/verify:
 *   patch:
 *     summary: Verify a pending beneficiary (admin only)
 *     tags: [Beneficiary]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The beneficiary's UUID
 *     responses:
 *       200:
 *         description: Beneficiary status changed to VERIFIED
 *       400:
 *         description: Beneficiary not found or not in PENDING state
 *       401:
 *         description: No token or invalid token
 *       403:
 *         description: Not an admin
 */
router.patch("/:id/verify", protect, authorize("ADMIN"), beneficiaryController.verifyBeneficiary);

/**
 * @swagger
 * /api/v1/beneficiary/{id}/block:
 *   patch:
 *     summary: Block a beneficiary (admin only)
 *     tags: [Beneficiary]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The beneficiary's UUID
 *     responses:
 *       200:
 *         description: Beneficiary status changed to BLOCKED
 *       400:
 *         description: Beneficiary not found or already blocked
 *       401:
 *         description: No token or invalid token
 *       403:
 *         description: Not an admin
 */
router.patch("/:id/block", protect, authorize("ADMIN"), beneficiaryController.blockBeneficiary);

module.exports = router;