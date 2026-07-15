import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

export const operationsStoreQuerySchema = z.object({
  storeId: storeIdSchema,
});

export type OperationsStoreQuery = z.infer<typeof operationsStoreQuerySchema>;
