import {
  PROMOTION_STATUSES,
  PROMOTION_TYPES,
} from "@commerceflow/types";
import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(200, "Name must be at most 200 characters");

const descriptionSchema = z
  .string()
  .trim()
  .max(2000, "Description must be at most 2000 characters")
  .optional();

const promotionCodeSchema = z
  .string()
  .trim()
  .min(1, "Code is required")
  .max(50, "Code must be at most 50 characters")
  .regex(
    /^[A-Za-z0-9_-]+$/,
    "Code must contain letters, numbers, underscores, and hyphens only",
  )
  .transform((value) => value.toUpperCase());

const promotionValueSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Value must be a valid decimal amount");

const currencySchema = z
  .string()
  .trim()
  .length(3, "Currency must be a 3-letter ISO code")
  .transform((value) => value.toUpperCase());

const datetimeSchema = z.string().datetime({
  message: "Must be a valid ISO datetime",
});

const promotionBaseSchema = z.object({
  storeId: storeIdSchema,
  name: nameSchema,
  code: promotionCodeSchema,
  description: descriptionSchema,
  type: z.enum(PROMOTION_TYPES),
  value: promotionValueSchema,
  currency: currencySchema.optional(),
  status: z.enum(PROMOTION_STATUSES).default("draft"),
  startsAt: datetimeSchema,
  endsAt: datetimeSchema,
});

function validatePromotionRules(
  data: {
    type: (typeof PROMOTION_TYPES)[number];
    value: string;
    currency?: string;
    startsAt: string;
    endsAt: string;
  },
  ctx: z.RefinementCtx,
): void {
  const numericValue = Number.parseFloat(data.value);

  if (data.type === "percentage") {
    if (numericValue <= 0 || numericValue > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Percentage value must be greater than 0 and at most 100",
        path: ["value"],
      });
    }

    if (data.currency) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Currency must not be set for percentage promotions",
        path: ["currency"],
      });
    }
  } else if (numericValue <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Fixed amount value must be greater than 0",
      path: ["value"],
    });
  } else if (!data.currency) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Currency is required for fixed amount promotions",
      path: ["currency"],
    });
  }

  if (new Date(data.startsAt).getTime() >= new Date(data.endsAt).getTime()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "startsAt must be before endsAt",
      path: ["endsAt"],
    });
  }
}

export const createPromotionSchema = promotionBaseSchema.superRefine(
  validatePromotionRules,
);

export const updatePromotionSchema = promotionBaseSchema
  .omit({ storeId: true })
  .partial()
  .superRefine((data, ctx) => {
    if (
      data.type === undefined &&
      data.value === undefined &&
      data.currency === undefined &&
      data.startsAt === undefined &&
      data.endsAt === undefined
    ) {
      return;
    }

    if (
      data.type === "percentage" &&
      data.value !== undefined &&
      data.currency === undefined
    ) {
      const numericValue = Number.parseFloat(data.value);
      if (numericValue <= 0 || numericValue > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Percentage value must be greater than 0 and at most 100",
          path: ["value"],
        });
      }
    }

    if (data.type === "fixed_amount" && data.value !== undefined) {
      const numericValue = Number.parseFloat(data.value);
      if (numericValue <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Fixed amount value must be greater than 0",
          path: ["value"],
        });
      }
    }

    if (data.startsAt !== undefined && data.endsAt !== undefined) {
      if (new Date(data.startsAt).getTime() >= new Date(data.endsAt).getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "startsAt must be before endsAt",
          path: ["endsAt"],
        });
      }
    }
  });

export const listPromotionsQuerySchema = z.object({
  storeId: storeIdSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(PROMOTION_STATUSES).optional(),
  search: z.string().trim().max(200).optional(),
});

export const promotionIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;
export type UpdatePromotionInput = z.infer<typeof updatePromotionSchema>;
export type ListPromotionsQuery = z.infer<typeof listPromotionsQuerySchema>;
