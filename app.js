const express = require("express");
const cors = require("cors");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./src/config/swagger");

const { errorHandler } = require("./src/middlewares/errorHandler.middleware");

const authRoutes = require("./src/routes/auth.routes");
const walletRoutes = require("./src/routes/wallet.routes");
const channelRoutes = require("./src/routes/channel.routes");
const topupRoutes = require("./src/routes/topup.routes");
const beneficiaryRoutes = require("./src/routes/beneficiary.routes");
const payoutRoutes = require("./src/routes/payout.routes");
const webhookRoutes = require("./src/routes/webhook.routes");

const app = express();
const { generalLimiter, authLimiter } = require("./src/middlewares/rateLimit.middleware");

app.use(cors());
app.use(express.json());
app.use(generalLimiter);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (req, res) => {
  res.json({ success: true, message: "Mini Payout v2 API running" });
});

app.use("/api/v1/auth",authLimiter, authRoutes);
app.use("/api/v1/wallet", walletRoutes);
app.use("/api/v1/channel",channelRoutes);
app.use("/api/v1/topup",topupRoutes)
app.use("/api/v1/beneficiary",beneficiaryRoutes)
app.use("/api/v1/payout", payoutRoutes);
app.use("/api/v1/webhooks", webhookRoutes);
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});
app.use(errorHandler);

module.exports = app;