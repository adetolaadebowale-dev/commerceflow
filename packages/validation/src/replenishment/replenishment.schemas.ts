import { REPLENISHMENT_RECOMMENDATION_STATUSES } from "@commerceflow/types";
import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");
const uuidSchema = z.string().uuid();

const positiveIntSchema = z.number().int().positive();
const nonNegativeIntSchema = z.number().int().min(0);

const currencySchema = z
  .string()
  .trim()
  .length(3, "Currency must be a 3-letter ISO code")
  .transform((value) => value.toUpperCase());

const unitCostSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Unit cost must be a valid decimal amount");

export const createReplenishmentRuleSchema = z
  .object({
    storeId: storeIdSchema,
    warehouseId: uuidSchema,
    productVariantId: uuidSchema,
    supplierId: uuidSchema,
    reorderPoint: positiveIntSchema,
    reorderQuantity: positiveIntSchema,
    minimumQuantity: nonNegativeIntSchema.optional(),
    maximumQuantity: positiveIntSchema.optional(),
    isEnabled: z.boolean().default(true),
  })
  .refine(
    (data) =>
      data.minimumQuantity === undefined ||
      data.minimumQuantity <= data.reorderPoint,
    {
      message: "Minimum quantity must be less than or equal to reorder point",
      path: ["minimumQuantity"],
    },
  )
  .refine(
    (data) =>
      data.maximumQuantity === undefined ||
      data.maximumQuantity >= data.reorderQuantity,
    {
      message: "Maximum quantity must be greater than or equal to reorder quantity",
      path: ["maximumQuantity"],
    },
  );

export const updateReplenishmentRuleSchema = z
  .object({
    supplierId: uuidSchema.optional(),
    reorderPoint: positiveIntSchema.optional(),
    reorderQuantity: positiveIntSchema.optional(),
    minimumQuantity: nonNegativeIntSchema.optional(),
    maximumQuantity: positiveIntSchema.optional(),
    isEnabled: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.supplierId !== undefined ||
      data.reorderPoint !== undefined ||
      data.reorderQuantity !== undefined ||
      data.minimumQuantity !== undefined ||
      data.maximumQuantity !== undefined ||
      data.isEnabled !== undefined,
    { message: "At least one field must be provided" },
  );

export const replenishmentRuleIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export const listReplenishmentRulesQuerySchema = z.object({
  storeId: storeIdSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  warehouseId: uuidSchema.optional(),
  isEnabled: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

export const generateReplenishmentRecommendationsSchema = z.object({
  storeId: storeIdSchema,
  warehouseId: uuidSchema.optional(),
});

export const replenishmentRecommendationIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export const listReplenishmentRecommendationsQuerySchema = z.object({
  storeId: storeIdSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  warehouseId: uuidSchema.optional(),
  status: z.enum(REPLENISHMENT_RECOMMENDATION_STATUSES).optional(),
});

export const acceptReplenishmentRecommendationSchema = z.object({
  storeId: storeIdSchema,
  unitCost: unitCostSchema,
  currency: currencySchema.default("USD"),
});

export const dismissReplenishmentRecommendationSchema = z.object({
  storeId: storeIdSchema,
});

export type CreateReplenishmentRuleInput = z.infer<
  typeof createReplenishmentRuleSchema
>;
export type UpdateReplenishmentRuleInput = z.infer<
  typeof updateReplenishmentRuleSchema
>;
export type ReplenishmentRuleIdQuery = z.infer<
  typeof replenishmentRuleIdQuerySchema
>;
export type ListReplenishmentRulesQuery = z.infer<
  typeof listReplenishmentRulesQuerySchema
>;
export type GenerateReplenishmentRecommendationsInput = z.infer<
  typeof generateReplenishmentRecommendationsSchema
>;
export type ReplenishmentRecommendationIdQuery = z.infer<
  typeof replenishmentRecommendationIdQuerySchema
>;
export type ListReplenishmentRecommendationsQuery = z.infer<
  typeof listReplenishmentRecommendationsQuerySchema
>;
export type AcceptReplenishmentRecommendationInput = z.infer<
  typeof acceptReplenishmentRecommendationSchema
>;
export type DismissReplenishmentRecommendationInput = z.infer<
  typeof dismissReplenishmentRecommendationSchema
>;
