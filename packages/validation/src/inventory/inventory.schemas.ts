import { ADJUSTMENT_STOCK_MOVEMENT_REASONS } from "@commerceflow/types";
import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

export const createInventoryItemSchema = z.object({
  storeId: storeIdSchema,
  warehouseId: z.string().uuid("Warehouse id must be a valid UUID"),
  productVariantId: z
    .string()
    .uuid("Product variant id must be a valid UUID"),
  initialQuantity: z
    .number()
    .int("Initial quantity must be a whole number")
    .min(0, "Initial quantity cannot be negative"),
});

export const inventoryItemIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export const listInventoryItemsQuerySchema = z.object({
  storeId: storeIdSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  warehouseId: z.string().uuid().optional(),
  productVariantId: z.string().uuid().optional(),
});

export const createStockMovementSchema = z.object({
  storeId: storeIdSchema,
  inventoryItemId: z.string().uuid("Inventory item id must be a valid UUID"),
  quantityChange: z
    .number()
    .int("Quantity change must be a whole number")
    .refine((value) => value !== 0, "Quantity change must not be zero"),
  reason: z.enum(ADJUSTMENT_STOCK_MOVEMENT_REASONS),
});

export const listStockMovementsQuerySchema = z.object({
  storeId: storeIdSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  warehouseId: z.string().uuid().optional(),
  inventoryItemId: z.string().uuid().optional(),
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;
export type ListInventoryItemsQuery = z.infer<
  typeof listInventoryItemsQuerySchema
>;
export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;
export type ListStockMovementsQuery = z.infer<
  typeof listStockMovementsQuerySchema
>;
