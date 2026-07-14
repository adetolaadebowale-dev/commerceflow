import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");
const customerIdSchema = z.string().uuid("Customer id must be a valid UUID");
const productVariantIdSchema = z
  .string()
  .uuid("Product variant id must be a valid UUID");

const quantitySchema = z
  .number()
  .int("Quantity must be an integer")
  .positive("Quantity must be greater than zero");

export const createCartSchema = z.object({
  storeId: storeIdSchema,
  customerId: customerIdSchema,
});

export const cartIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export const customerCartQuerySchema = z.object({
  storeId: storeIdSchema,
});

export const addCartItemSchema = z.object({
  productVariantId: productVariantIdSchema,
  quantity: quantitySchema,
});

export const updateCartItemSchema = z.object({
  quantity: quantitySchema,
});

export const cartItemIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export type CreateCartInput = z.infer<typeof createCartSchema>;
export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
