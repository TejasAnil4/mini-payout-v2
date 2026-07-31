const { z } = require("zod");

const addChannelSchema = z.object({
  bankName: z
    .string()
    .min(2, "Bank name must be at least 2 characters")
    .max(100, "Bank name is too long")
    .trim(),
    
  accountHolderName: z
    .string()
    .min(2, "Account holder name must be at least 2 characters")
    .max(100, "Account holder name is too long")
    .trim(),
  accountNumber: z
    .string()
    .min(9, "Account number must be at least 9 digits")
    .max(18, "Account number is too long")
    .regex(/^\d+$/, "Account number must contain only digits"),
  ifscCode: z
    .string()
    .length(11, "IFSC code must be exactly 11 characters")
    .toUpperCase()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format")
    
});

module.exports = { addChannelSchema };