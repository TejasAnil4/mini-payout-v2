const { Queue } = require("bullmq");
const connection = require("../config/redis");

const payoutNotificationQueue = new Queue("payout-notifications", { connection });

module.exports = { payoutNotificationQueue };