import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");
const customerAddressIdSchema = z
  .string()
  .uuid("Customer address id must be a valid UUID");

export const checkoutCartSchema = z.object({
  customerAddressId: customerAddressIdSchema,
});

export const checkoutCartQuerySchema = z.object({
  storeId: storeIdSchema,
});

export type CheckoutCartInput = z.infer<typeof checkoutCartSchema>;
export type CheckoutCartQuery = z.infer<typeof checkoutCartQuerySchema>;
