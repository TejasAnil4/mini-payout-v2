const expresss = require("express");
const router = expresss.Router();

const { authorize } = require("../middlewares/auth.middleware");


const walletController = require("../controllers/wallet.controller");
const { protect } = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: Merchant wallet operations
 */

/**
 * @swagger
 * /api/v1/wallet/me:
 *   get:
 *     summary: Get the logged-in merchant's wallet
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet data
 *       401:
 *         description: No token or invalid token
 *       403:
 *         description: Only merchants have wallets
 */
router.get("/me", protect, authorize("MERCHANT"), walletController.getMyWallet);

module.exports = router;