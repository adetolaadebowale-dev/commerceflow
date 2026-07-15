import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");
const uuidSchema = z.string().uuid();

const currencySchema = z
  .string()
  .trim()
  .length(3, "Currency must be a 3-letter ISO code")
  .transform((value) => value.toUpperCase());

const unitCostSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Unit cost must be a valid decimal amount");

export const createPurchaseOrderSchema = z.object({
  storeId: storeIdSchema,
  warehouseId: uuidSchema,
  supplierId: uuidSchema,
  expectedDeliveryDate: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
  items: z
    .array(
      z.object({
        productVariantId: uuidSchema,
        quantityOrdered: z.number().int().positive(),
        unitCost: unitCostSchema,
        currency: currencySchema,
      }),
    )
    .min(1),
});

export const purchaseOrderLifecycleSchema = z.object({
  storeId: storeIdSchema,
});

export const receivePurchaseOrderSchema = z.object({
  storeId: storeIdSchema,
  items: z
    .array(
      z.object({
        purchaseOrderItemId: uuidSchema,
        quantityReceived: z.number().int().positive(),
      }),
    )
    .min(1),
});

export const purchaseOrderIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export const listPurchaseOrdersQuerySchema = z.object({
  storeId: storeIdSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type PurchaseOrderLifecycleInput = z.infer<
  typeof purchaseOrderLifecycleSchema
>;
export type ReceivePurchaseOrderInput = z.infer<typeof receivePurchaseOrderSchema>;
export type PurchaseOrderIdQuery = z.infer<typeof purchaseOrderIdQuerySchema>;
export type ListPurchaseOrdersQuery = z.infer<
  typeof listPurchaseOrdersQuerySchema
>;
