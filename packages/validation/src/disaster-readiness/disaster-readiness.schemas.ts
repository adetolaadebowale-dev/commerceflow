import { BACKUP_PROVIDERS } from "@commerceflow/types";
import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

export const disasterReadinessStoreQuerySchema = z.object({
  storeId: storeIdSchema,
});

export const updateRecoveryObjectivesSchema = z.object({
  storeId: storeIdSchema,
  rpoMinutes: z
    .number()
    .int("RPO must be an integer")
    .min(1, "RPO must be at least 1 minute")
    .max(43_200, "RPO must be at most 30 days"),
  rtoMinutes: z
    .number()
    .int("RTO must be an integer")
    .min(1, "RTO must be at least 1 minute")
    .max(10_080, "RTO must be at most 7 days"),
});

export const updateBackupConfigurationSchema = z.object({
  storeId: storeIdSchema,
  enabled: z.boolean(),
  provider: z.enum(BACKUP_PROVIDERS),
  scheduleCron: z
    .string()
    .trim()
    .max(100, "Schedule cron must be at most 100 characters")
    .optional(),
  retentionDays: z
    .number()
    .int("Retention days must be an integer")
    .min(1, "Retention must be at least 1 day")
    .max(365, "Retention must be at most 365 days"),
  lastVerifiedAt: z.string().datetime().optional().nullable(),
  notes: z
    .string()
    .trim()
    .max(500, "Notes must be at most 500 characters")
    .optional(),
});

export type DisasterReadinessStoreQuery = z.infer<
  typeof disasterReadinessStoreQuerySchema
>;
export type UpdateRecoveryObjectivesInput = z.infer<
  typeof updateRecoveryObjectivesSchema
>;
export type UpdateBackupConfigurationInput = z.infer<
  typeof updateBackupConfigurationSchema
>;
