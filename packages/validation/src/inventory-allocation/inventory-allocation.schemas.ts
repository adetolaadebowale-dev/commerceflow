import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

export const allocateInventorySchema = z.object({
  inventoryItemId: z.string().uuid("Inventory item id must be a valid UUID"),
  quantityAllocated: z
    .number()
    .int("Quantity allocated must be a whole number")
    .min(1, "Quantity allocated must be at least 1"),
});

export const updateInventoryAllocationSchema = z.object({
  quantityPicked: z
    .number()
    .int("Quantity picked must be a whole number")
    .min(0, "Quantity picked must be greater than or equal to 0"),
});

export const reportShortageSchema = z.object({
  shortageReason: z
    .string()
    .trim()
    .min(1, "Shortage reason is required")
    .max(500, "Shortage reason must be at most 500 characters"),
});

export const inventoryAllocationIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export type AllocateInventoryInput = z.infer<typeof allocateInventorySchema>;
export type UpdateInventoryAllocationInput = z.infer<
  typeof updateInventoryAllocationSchema
>;
export type ReportShortageInput = z.infer<typeof reportShortageSchema>;
export type InventoryAllocationIdQuery = z.infer<
  typeof inventoryAllocationIdQuerySchema
>;
