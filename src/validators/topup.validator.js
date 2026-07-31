const { z } = require("zod");

const createTopupSchema = z.object({
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be a positive number")
    .max(1000000, "Amount exceeds maximum allowed limit"),
});

module.exports = { createTopupSchema };