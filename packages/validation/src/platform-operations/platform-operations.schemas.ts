import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

export const platformStoreQuerySchema = z.object({
  storeId: storeIdSchema,
});

export const updateMaintenanceModeSchema = z.object({
  storeId: storeIdSchema,
  maintenanceMode: z.boolean(),
  maintenanceMessage: z
    .string()
    .trim()
    .max(500, "Maintenance message must be at most 500 characters")
    .optional()
    .nullable(),
});

export type PlatformStoreQuery = z.infer<typeof platformStoreQuerySchema>;
export type UpdateMaintenanceModeInput = z.infer<
  typeof updateMaintenanceModeSchema
>;
