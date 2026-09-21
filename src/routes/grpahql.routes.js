/**
 * @swagger
 * /graphql:
 *   post:
 *     tags: [GraphQL]
 *     summary: GraphQL endpoint
 *     description: |
 *       Accepts GraphQL queries and mutations. Auth via Bearer JWT token.
 *
 *       **Available queries:**
 *       - `myWallet` — returns authenticated merchant's wallet
 *       - `myTransactions(type: String)` — returns transactions, filtered by PAYOUT or WALLET_TOPUP
 *
 *       **Example:**
 *       ```json
 *       {
 *         "query": "{ myWallet { balance status } }"
 *       }
 *       ```
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 example: "{ myWallet { balance status } myTransactions(type: \"PAYOUT\") { referenceId amount status } }"
 *           example:
 *             query: "{ myWallet { balance status } }"
 *     responses:
 *       200:
 *         description: GraphQL response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *             example:
 *               data:
 *                 myWallet:
 *                   balance: 5405
 *                   status: "ACTIVE"
 *       401:
 *         description: Unauthorized — missing or invalid JWT
 */