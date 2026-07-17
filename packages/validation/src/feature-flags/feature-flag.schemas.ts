import { FEATURE_FLAG_SCOPES } from "@commerceflow/types";
import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

export const featureFlagKeySchema = z
  .string()
  .trim()
  .min(1, "Key is required")
  .max(100, "Key must be at most 100 characters")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Key must use lowercase letters, numbers, and hyphens",
  );

export const upsertFeatureFlagSchema = z.object({
  storeId: storeIdSchema,
  scope: z.enum(FEATURE_FLAG_SCOPES),
  enabled: z.boolean(),
  description: z
    .string()
    .trim()
    .max(500, "Description must be at most 500 characters")
    .optional(),
});

export const listFeatureFlagsQuerySchema = z.object({
  storeId: storeIdSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const effectiveFeatureFlagsQuerySchema = z.object({
  storeId: storeIdSchema,
  keys: z
    .string()
    .trim()
    .optional()
    .transform((value) =>
      value
        ? value
            .split(",")
            .map((key) => key.trim())
            .filter((key) => key.length > 0)
        : undefined,
    ),
});

export const featureFlagKeyParamSchema = z.object({
  key: featureFlagKeySchema,
});

export type UpsertFeatureFlagInput = z.infer<typeof upsertFeatureFlagSchema>;
export type ListFeatureFlagsQuery = z.infer<typeof listFeatureFlagsQuerySchema>;
export type EffectiveFeatureFlagsQuery = z.infer<
  typeof effectiveFeatureFlagsQuerySchema
>;
