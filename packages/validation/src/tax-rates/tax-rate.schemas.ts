import { TAX_RATE_STATUSES } from "@commerceflow/types";
import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

const taxRateNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(200, "Name must be at most 200 characters");

const taxRatePercentageSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Percentage must be a valid decimal amount")
  .superRefine((value, ctx) => {
    const numericValue = Number.parseFloat(value);

    if (numericValue < 0 || numericValue > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Percentage must be between 0 and 100",
        path: [],
      });
    }
  });

export const createTaxRateSchema = z.object({
  storeId: storeIdSchema,
  name: taxRateNameSchema,
  percentage: taxRatePercentageSchema,
  status: z.enum(TAX_RATE_STATUSES).default("inactive"),
});

export const updateTaxRateSchema = z
  .object({
    name: taxRateNameSchema.optional(),
    percentage: taxRatePercentageSchema.optional(),
    status: z.enum(TAX_RATE_STATUSES).optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.percentage !== undefined ||
      data.status !== undefined,
    { message: "At least one field must be provided" },
  );

export const listTaxRatesQuerySchema = z.object({
  storeId: storeIdSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(TAX_RATE_STATUSES).optional(),
  search: z.string().trim().max(200).optional(),
});

export const taxRateIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export type CreateTaxRateInput = z.infer<typeof createTaxRateSchema>;
export type UpdateTaxRateInput = z.infer<typeof updateTaxRateSchema>;
export type ListTaxRatesQuery = z.infer<typeof listTaxRatesQuerySchema>;
