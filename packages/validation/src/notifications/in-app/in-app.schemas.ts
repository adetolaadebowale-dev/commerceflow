import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");
const userIdSchema = z.string().uuid("User id must be a valid UUID");

export const listInAppNotificationsQuerySchema = z.object({
  storeId: storeIdSchema,
  userId: userIdSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unreadOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
});

export const inAppNotificationQuerySchema = z.object({
  storeId: storeIdSchema,
  userId: userIdSchema,
});

export type ListInAppNotificationsQuery = z.infer<
  typeof listInAppNotificationsQuerySchema
>;
export type InAppNotificationQuery = z.infer<typeof inAppNotificationQuerySchema>;
