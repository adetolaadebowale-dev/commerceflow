import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

const promotionCodeSchema = z
  .string()
  .trim()
  .min(1, "Code is required")
  .max(50, "Code must be at most 50 characters");

export const applyCartPromotionSchema = z.object({
  code: promotionCodeSchema,
});

export const cartPromotionActionSchema = z.object({
  storeId: storeIdSchema,
});

export type ApplyCartPromotionInput = z.infer<typeof applyCartPromotionSchema>;
export type CartPromotionActionQuery = z.infer<typeof cartPromotionActionSchema>;
