import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_PROVIDER_TYPES,
  NOTIFICATION_STATUSES,
} from "@commerceflow/types";
import { z } from "zod";

import { emailRecipientSchema } from "./email/email.schemas";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");
const optionalUuidSchema = z.string().uuid().optional();

const notificationBodySchema = z
  .string()
  .trim()
  .min(1, "Body is required")
  .max(10000, "Body must be at most 10000 characters");

const notificationSubjectSchema = z
  .string()
  .trim()
  .min(1, "Subject must not be empty")
  .max(500, "Subject must be at most 500 characters")
  .optional();

const notificationTitleSchema = z
  .string()
  .trim()
  .min(1, "Title must not be empty")
  .max(200, "Title must be at most 200 characters")
  .optional();

const notificationMetadataSchema = z.record(z.unknown()).optional();

export const createNotificationSchema = z
  .object({
    storeId: storeIdSchema,
    userId: optionalUuidSchema,
    customerId: optionalUuidSchema,
    channel: z.enum(NOTIFICATION_CHANNELS),
    provider: z.enum(NOTIFICATION_PROVIDER_TYPES).default("console"),
    to: emailRecipientSchema.optional(),
    subject: notificationSubjectSchema,
    title: notificationTitleSchema,
    body: notificationBodySchema,
    metadata: notificationMetadataSchema,
  })
  .superRefine((data, ctx) => {
    if (data.channel === "email" && !data.to) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Recipient is required for email notifications",
        path: ["to"],
      });
    }
  });

export const listNotificationsQuerySchema = z.object({
  storeId: storeIdSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  channel: z.enum(NOTIFICATION_CHANNELS).optional(),
  status: z.enum(NOTIFICATION_STATUSES).optional(),
  userId: optionalUuidSchema,
  customerId: optionalUuidSchema,
});

export const notificationIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
