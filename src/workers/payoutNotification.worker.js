const { Worker } = require("bullmq");
const connection = require("../config/redis");

const worker = new Worker(
  "payout-notifications",
  async (job) => {            
    const { transactionId, merchantId, amount } = job.data;

    console.log(`[Worker] Processing job ${job.id}: notify merchant ${merchantId} about payout ${transactionId} (₹${amount})`);

    // Simulate sending an email (in reality: call a real email service here)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log(`[Worker] Notification sent for transaction ${transactionId}`);
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully`);
});

worker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job.id} failed:`, err.message);
});

console.log("Payout notification worker started, waiting for jobs...");