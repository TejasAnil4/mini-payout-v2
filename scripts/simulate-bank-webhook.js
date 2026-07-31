// scripts/simulate-bank-webhook.js
require("dotenv").config();
const crypto = require("crypto");

// ── Fill these in to match your test data ──
const payload = {
  referenceId: "BANK-TXN-98765",
  amount: 2000,
  accountNumber: "9999999992",
};

const secret = process.env.WEBHOOK_SECRET;

// This is EXACTLY what the middleware will recompute on the server side
const body = JSON.stringify(payload);
const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");

async function sendFakeWebhook() {
  const response = await fetch("http://localhost:5005/api/v1/webhooks/bank-transfer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Signature": signature,
    },
    body,
  });

  const data = await response.json();
  console.log("Status:", response.status);
  console.log("Response:", JSON.stringify(data, null, 2));
}

sendFakeWebhook();