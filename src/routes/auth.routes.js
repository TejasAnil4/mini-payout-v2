const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const { validate } = require("../middlewares/validate.middleware");
const { registerSchema, loginSchema } = require("../validators/auth.validator");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Registration and login
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new merchant
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, fullName, phoneNumber]
 *             properties:
 *               email:
 *                 type: string
 *                 example: merchant@test.com
 *               password:
 *                 type: string
 *                 example: merchant1234
 *               fullName:
 *                 type: string
 *                 example: Merchant One
 *               phoneNumber:
 *                 type: string
 *                 example: "9999911111"
 *     responses:
 *       201:
 *         description: User created with wallet
 *       409:
 *         description: Email or phone already exists
 */
router.post("/register", validate(registerSchema), authController.register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login and receive a JWT token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: merchant1@test.com
 *               password:
 *                 type: string
 *                 example: merchant1234
 *     responses:
 *       200:
 *         description: Token issued
 *       401:
 *         description: Invalid email or password
 */
router.post("/login", validate(loginSchema), authController.login);

module.exports = router;