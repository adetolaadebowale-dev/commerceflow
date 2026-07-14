import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

export const orderFulfillmentActionSchema = z.object({
  storeId: storeIdSchema,
});

export type OrderFulfillmentActionQuery = z.infer<
  typeof orderFulfillmentActionSchema
>;
