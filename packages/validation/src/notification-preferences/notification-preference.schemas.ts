import {
  NOTIFICATION_PREFERENCE_TYPES,
} from "@commerceflow/types";
import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

export const listNotificationPreferencesQuerySchema = z.object({
  storeId: storeIdSchema,
});

export const notificationPreferenceTypeParamSchema = z.enum(
  NOTIFICATION_PREFERENCE_TYPES,
);

export const updateNotificationPreferenceSchema = z.object({
  storeId: storeIdSchema,
  emailEnabled: z.boolean(),
  smsEnabled: z.boolean(),
  inAppEnabled: z.boolean(),
});

export const notificationPreferenceRouteParamsSchema = z.object({
  type: notificationPreferenceTypeParamSchema,
});

export type ListNotificationPreferencesQuery = z.infer<
  typeof listNotificationPreferencesQuerySchema
>;

export type UpdateNotificationPreferenceInput = z.infer<
  typeof updateNotificationPreferenceSchema
>;

export type NotificationPreferenceTypeParam = z.infer<
  typeof notificationPreferenceTypeParamSchema
>;
