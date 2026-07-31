const { z } = require("zod");

const createPayoutSchema = z.object({
  beneficiaryId: z.string().uuid("beneficiaryId must be a valid UUID"),
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be a positive number")
    .max(1000000, "Amount exceeds maximum allowed limit"),
  idempotencyKey: z
    .string()
    .min(1, "idempotencyKey cannot be empty")
    .max(255, "idempotencyKey is too long")
    .optional(),
});

module.exports = { createPayoutSchema };