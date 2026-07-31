const { z } = require("zod");

const addBeneficiarySchema = z
  .object({
    type: z.enum(["BANK", "INTERNAL_WALLET"], {
      errorMap: () => ({ message: "Type must be either BANK or INTERNAL_WALLET" }),
    }),
    beneficiaryName: z
      .string()
      .min(2, "Beneficiary name must be at least 2 characters")
      .max(100, "Beneficiary name is too long")
      .trim(),
    accountHolderName: z.string().trim().optional(),
    accountNumber: z
      .string()
      .regex(/^\d+$/, "Account number must contain only digits")
      .optional(),
    ifscCode: z
      .string()
      .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/i, "Invalid IFSC code format")
      .optional(),
    bankName: z.string().trim().optional(),
    linkedUserId: z.string().uuid("linkedUserId must be a valid UUID").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "BANK") {
      if (!data.accountHolderName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["accountHolderName"],
          message: "accountHolderName is required for BANK beneficiaries",
        });
      }
      if (!data.accountNumber) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["accountNumber"],
          message: "accountNumber is required for BANK beneficiaries",
        });
      }
      if (!data.ifscCode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ifscCode"],
          message: "ifscCode is required for BANK beneficiaries",
        });
      }
      if (!data.bankName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["bankName"],
          message: "bankName is required for BANK beneficiaries",
        });
      }
    }

    if (data.type === "INTERNAL_WALLET") {
      if (!data.linkedUserId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["linkedUserId"],
          message: "linkedUserId is required for INTERNAL_WALLET beneficiaries",
        });
      }
    }
  });

module.exports = { addBeneficiarySchema };