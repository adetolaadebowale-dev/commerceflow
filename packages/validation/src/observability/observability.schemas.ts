import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

export const observabilityStoreQuerySchema = z.object({
  storeId: storeIdSchema,
});

export type ObservabilityStoreQuery = z.infer<
  typeof observabilityStoreQuerySchema
>;
