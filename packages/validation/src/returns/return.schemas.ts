import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");
const uuidSchema = z.string().uuid();

const returnConditionSchema = z.enum([
  "new",
  "opened",
  "damaged",
  "defective",
]);

export const createReturnSchema = z.object({
  storeId: storeIdSchema,
  shipmentId: uuidSchema,
  reason: z.string().trim().min(1).max(500),
  notes: z.string().trim().max(2000).optional(),
  items: z
    .array(
      z.object({
        orderItemId: uuidSchema,
        inventoryItemId: uuidSchema,
        quantityRequested: z.number().int().min(1),
      }),
    )
    .min(1),
});

export const receiveReturnSchema = z.object({
  storeId: storeIdSchema,
  items: z
    .array(
      z.object({
        returnItemId: uuidSchema,
        quantityReceived: z.number().int().min(0),
      }),
    )
    .min(1),
});

export const inspectReturnSchema = z.object({
  storeId: storeIdSchema,
  items: z
    .array(
      z.object({
        returnItemId: uuidSchema,
        condition: returnConditionSchema,
      }),
    )
    .min(1),
});

export const completeReturnSchema = z.object({
  storeId: storeIdSchema,
});

export const returnIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export const listReturnsQuerySchema = z.object({
  storeId: storeIdSchema,
});

export type CreateReturnInput = z.infer<typeof createReturnSchema>;
export type ReceiveReturnInput = z.infer<typeof receiveReturnSchema>;
export type InspectReturnInput = z.infer<typeof inspectReturnSchema>;
export type CompleteReturnInput = z.infer<typeof completeReturnSchema>;
export type ReturnIdQuery = z.infer<typeof returnIdQuerySchema>;
export type ListReturnsQuery = z.infer<typeof listReturnsQuerySchema>;
