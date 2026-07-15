import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");
const uuidSchema = z.string().uuid();

export const createInventoryAdjustmentSchema = z.object({
  storeId: storeIdSchema,
  inventoryItemId: uuidSchema,
  movementQuantity: z
    .number()
    .int("Movement quantity must be a whole number")
    .refine((value) => value !== 0, "Movement quantity must not be zero"),
  reason: z.string().trim().min(1).max(500),
  notes: z.string().trim().max(2000).optional(),
});

export const inventoryAdjustmentIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export const listInventoryAdjustmentsQuerySchema = z.object({
  storeId: storeIdSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  inventoryItemId: uuidSchema.optional(),
});

export type CreateInventoryAdjustmentInput = z.infer<
  typeof createInventoryAdjustmentSchema
>;
export type InventoryAdjustmentIdQuery = z.infer<
  typeof inventoryAdjustmentIdQuerySchema
>;
export type ListInventoryAdjustmentsQuery = z.infer<
  typeof listInventoryAdjustmentsQuerySchema
>;
