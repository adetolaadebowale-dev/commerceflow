import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");
const uuidSchema = z.string().uuid();

export const createWarehouseTransferSchema = z
  .object({
    storeId: storeIdSchema,
    sourceWarehouseId: uuidSchema,
    destinationWarehouseId: uuidSchema,
    notes: z.string().max(2000).optional(),
    items: z
      .array(
        z.object({
          inventoryItemId: uuidSchema,
          quantity: z.number().int().positive(),
        }),
      )
      .min(1),
  })
  .refine(
    (value) => value.sourceWarehouseId !== value.destinationWarehouseId,
    {
      message: "Source and destination warehouses must differ",
      path: ["destinationWarehouseId"],
    },
  );

export const warehouseTransferLifecycleSchema = z.object({
  storeId: storeIdSchema,
});

export const warehouseTransferIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export const listWarehouseTransfersQuerySchema = z.object({
  storeId: storeIdSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateWarehouseTransferInput = z.infer<
  typeof createWarehouseTransferSchema
>;
export type WarehouseTransferLifecycleInput = z.infer<
  typeof warehouseTransferLifecycleSchema
>;
export type WarehouseTransferIdQuery = z.infer<
  typeof warehouseTransferIdQuerySchema
>;
export type ListWarehouseTransfersQuery = z.infer<
  typeof listWarehouseTransfersQuerySchema
>;
