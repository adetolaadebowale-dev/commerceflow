import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

export const databaseOptimizationStoreQuerySchema = z.object({
  storeId: storeIdSchema,
});

export type DatabaseOptimizationStoreQuery = z.infer<
  typeof databaseOptimizationStoreQuerySchema
>;
