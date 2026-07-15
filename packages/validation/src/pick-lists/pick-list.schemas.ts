import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

const pickListItemUpdateSchema = z.object({
  orderItemId: z.string().uuid("Order item id must be a valid UUID"),
  quantityPicked: z
    .number()
    .int("Quantity picked must be a whole number")
    .min(0, "Quantity picked must be greater than or equal to 0"),
});

export const createPickListSchema = z.object({
  assignedToUserId: z
    .string()
    .uuid("Assigned user id must be a valid UUID")
    .optional(),
});

export const updatePickListSchema = z
  .object({
    assignedToUserId: z
      .string()
      .uuid("Assigned user id must be a valid UUID")
      .optional(),
    items: z
      .array(pickListItemUpdateSchema)
      .min(1, "At least one pick list item is required")
      .optional(),
  })
  .refine(
    (value) =>
      value.assignedToUserId !== undefined ||
      (value.items !== undefined && value.items.length > 0),
    { message: "At least one field must be provided" },
  );

export const pickListIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export const pickListQuerySchema = z.object({
  storeId: storeIdSchema,
});

export type CreatePickListInput = z.infer<typeof createPickListSchema>;
export type UpdatePickListInput = z.infer<typeof updatePickListSchema>;
export type PickListIdQuery = z.infer<typeof pickListIdQuerySchema>;
export type PickListQuery = z.infer<typeof pickListQuerySchema>;
