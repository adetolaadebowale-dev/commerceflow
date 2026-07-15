import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

export const orderFulfillmentActionSchema = z.object({
  storeId: storeIdSchema,
});

export const createFulfillmentSchema = z.object({
  storeId: storeIdSchema,
});

export const stockMovementIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export const listInventoryItemStockMovementsQuerySchema = z.object({
  storeId: storeIdSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type OrderFulfillmentActionQuery = z.infer<
  typeof orderFulfillmentActionSchema
>;
export type CreateFulfillmentInput = z.infer<typeof createFulfillmentSchema>;
export type StockMovementIdQuery = z.infer<typeof stockMovementIdQuerySchema>;
export type ListInventoryItemStockMovementsQuery = z.infer<
  typeof listInventoryItemStockMovementsQuerySchema
>;

