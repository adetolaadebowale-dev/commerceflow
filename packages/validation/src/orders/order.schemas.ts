import { ORDER_STATUSES } from "@commerceflow/types";
import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

export const createOrderItemInputSchema = z.object({
  productVariantId: z
    .string()
    .uuid("Product variant id must be a valid UUID"),
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),
});

export const createOrderSchema = z.object({
  storeId: storeIdSchema,
  customerId: z.string().uuid("Customer id must be a valid UUID").optional(),
  status: z.enum(ORDER_STATUSES).default("draft"),
  items: z
    .array(createOrderItemInputSchema)
    .min(1, "At least one order item is required"),
});

export const orderIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export const listOrdersQuerySchema = z.object({
  storeId: storeIdSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(ORDER_STATUSES).optional(),
  customerId: z.string().uuid().optional(),
});

export type CreateOrderItemInput = z.infer<typeof createOrderItemInputSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
