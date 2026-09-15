console.log("[Worker] Script starting...");

const { Worker } = require("bullmq");
const connection = require("../config/redis");

console.log("[Worker] Redis connection module loaded, creating Worker...");

const worker = new Worker(
  "payout-notifications",
  async (job) => {
    const { transactionId, merchantId, amount } = job.data;
    console.log(`[Worker] Processing job ${job.id}: notify merchant ${merchantId} about payout ${transactionId} (₹${amount})`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(`[Worker] Notification sent for transaction ${transactionId}`);
  },
  { connection }
);

console.log("[Worker] Worker instance created, registering listeners...");

worker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully`);
});

worker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job.id} failed:`, err.message);
});

console.log("Payout notification worker started, waiting for jobs...");