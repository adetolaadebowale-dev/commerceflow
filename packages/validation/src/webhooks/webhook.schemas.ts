import {
  WEBHOOK_SUBSCRIBABLE_EVENT_TYPES,
} from "@commerceflow/types";
import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

const webhookUrlSchema = z
  .string()
  .trim()
  .url("URL must be valid")
  .max(2048, "URL must be at most 2048 characters");

const subscribedEventsSchema = z
  .array(z.enum(WEBHOOK_SUBSCRIBABLE_EVENT_TYPES))
  .min(1, "At least one event must be subscribed");

export const createWebhookSchema = z.object({
  storeId: storeIdSchema,
  url: webhookUrlSchema,
  enabled: z.boolean().default(true),
  subscribedEvents: subscribedEventsSchema,
});

export const updateWebhookSchema = z
  .object({
    url: webhookUrlSchema.optional(),
    enabled: z.boolean().optional(),
    subscribedEvents: subscribedEventsSchema.optional(),
  })
  .refine(
    (data) =>
      data.url !== undefined ||
      data.enabled !== undefined ||
      data.subscribedEvents !== undefined,
    { message: "At least one field must be provided" },
  );

export const listWebhooksQuerySchema = z.object({
  storeId: storeIdSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const webhookIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export const listWebhookDeliveriesQuerySchema = z.object({
  storeId: storeIdSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;
export type UpdateWebhookInput = z.infer<typeof updateWebhookSchema>;
export type ListWebhooksQuery = z.infer<typeof listWebhooksQuerySchema>;
export type ListWebhookDeliveriesQuery = z.infer<
  typeof listWebhookDeliveriesQuerySchema
>;
