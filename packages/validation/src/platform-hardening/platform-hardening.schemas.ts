import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

export const platformHardeningStoreQuerySchema = z.object({
  storeId: storeIdSchema,
});

export const updateCachePolicySchema = z.object({
  storeId: storeIdSchema,
  resource: z
    .string()
    .trim()
    .min(1, "Resource is required")
    .max(100, "Resource must be at most 100 characters")
    .regex(
      /^[a-z0-9]+(?:\.[a-z0-9]+)*$/,
      "Resource must use lowercase dotted segments",
    ),
  enabled: z.boolean(),
  ttlSeconds: z
    .number()
    .int("TTL must be an integer")
    .min(1, "TTL must be at least 1 second")
    .max(86_400, "TTL must be at most 86400 seconds"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be at most 500 characters")
    .optional(),
});

export type PlatformHardeningStoreQuery = z.infer<
  typeof platformHardeningStoreQuerySchema
>;
export type UpdateCachePolicyInput = z.infer<typeof updateCachePolicySchema>;
