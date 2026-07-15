import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");
const uuidSchema = z.string().uuid();

export const createCycleCountSchema = z.object({
  storeId: storeIdSchema,
  inventoryItemIds: z.array(uuidSchema).min(1),
});

export const updateCycleCountSchema = z.object({
  storeId: storeIdSchema,
  items: z
    .array(
      z.object({
        cycleCountItemId: uuidSchema,
        countedQuantity: z.number().int().min(0),
      }),
    )
    .min(1),
});

export const approveCycleCountSchema = z.object({
  storeId: storeIdSchema,
});

export const cycleCountIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export const listCycleCountsQuerySchema = z.object({
  storeId: storeIdSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateCycleCountInput = z.infer<typeof createCycleCountSchema>;
export type UpdateCycleCountInput = z.infer<typeof updateCycleCountSchema>;
export type ApproveCycleCountInput = z.infer<typeof approveCycleCountSchema>;
export type CycleCountIdQuery = z.infer<typeof cycleCountIdQuerySchema>;
export type ListCycleCountsQuery = z.infer<typeof listCycleCountsQuerySchema>;
