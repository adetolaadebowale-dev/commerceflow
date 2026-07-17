import { LOAD_TEST_TOOLS } from "@commerceflow/types";
import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

export const loadTestingStoreQuerySchema = z.object({
  storeId: storeIdSchema,
});

export const updateLoadTestingConfigurationSchema = z.object({
  storeId: storeIdSchema,
  enabled: z.boolean(),
  preferredTool: z.enum(LOAD_TEST_TOOLS),
  targetVirtualUsers: z
    .number()
    .int("Target virtual users must be an integer")
    .min(1, "Target virtual users must be at least 1")
    .max(100_000, "Target virtual users must be at most 100000"),
  durationSeconds: z
    .number()
    .int("Duration must be an integer")
    .min(1, "Duration must be at least 1 second")
    .max(86_400, "Duration must be at most 86400 seconds"),
  rampUpSeconds: z
    .number()
    .int("Ramp-up must be an integer")
    .min(0, "Ramp-up must be at least 0 seconds")
    .max(3_600, "Ramp-up must be at most 3600 seconds"),
  notes: z
    .string()
    .trim()
    .max(500, "Notes must be at most 500 characters")
    .optional(),
});

export type LoadTestingStoreQuery = z.infer<typeof loadTestingStoreQuerySchema>;
export type UpdateLoadTestingConfigurationInput = z.infer<
  typeof updateLoadTestingConfigurationSchema
>;
