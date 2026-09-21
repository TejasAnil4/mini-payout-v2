const { Queue } = require("bullmq");
const connection = require("../config/redis");

const payoutNotificationQueue = new Queue("payout-notifications", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  },
});

module.exports = { payoutNotificationQueue };