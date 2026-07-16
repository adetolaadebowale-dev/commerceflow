import { EMAIL_PROVIDER_TYPES } from "@commerceflow/types";
import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

export const emailRecipientSchema = z.object({
  email: z.string().trim().email("Recipient email must be valid"),
  name: z
    .string()
    .trim()
    .min(1, "Recipient name must not be empty")
    .max(200, "Recipient name must be at most 200 characters")
    .optional(),
});

const emailSubjectSchema = z
  .string()
  .trim()
  .min(1, "Subject is required")
  .max(500, "Subject must be at most 500 characters");

const emailBodySchema = z
  .string()
  .trim()
  .min(1, "Body is required")
  .max(10000, "Body must be at most 10000 characters");

const emailMetadataSchema = z.record(z.unknown()).optional();

export const sendTestEmailNotificationSchema = z.object({
  storeId: storeIdSchema,
  to: emailRecipientSchema,
  subject: emailSubjectSchema,
  body: emailBodySchema,
  provider: z.enum(EMAIL_PROVIDER_TYPES).default("console"),
  metadata: emailMetadataSchema,
});

export type SendTestEmailNotificationInput = z.infer<
  typeof sendTestEmailNotificationSchema
>;

export type EmailRecipientInput = z.infer<typeof emailRecipientSchema>;
