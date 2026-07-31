const crypto = require("crypto");

const verifyWebhookSignature = (req, res, next) => {
  const signature = req.headers["x-webhook-signature"];

  if (!signature) {
    return res.status(401).json({
      success: false,
      message: "Missing webhook signature",
    });
  }

  const payload = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac("sha256", process.env.WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  if (signature !== expectedSignature) {
    return res.status(401).json({
      success: false,
      message: "Invalid webhook signature",
    });
  }

  next();
};

module.exports = { verifyWebhookSignature };