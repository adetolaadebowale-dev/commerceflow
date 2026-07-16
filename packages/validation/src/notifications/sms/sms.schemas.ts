import { SMS_PROVIDER_TYPES } from "@commerceflow/types";
import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

export const smsRecipientSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(7, "Phone number is required")
    .max(20, "Phone number must be at most 20 characters")
    .regex(
      /^\+?[0-9]{7,15}$/,
      "Phone number must contain 7 to 15 digits and may start with +",
    ),
  name: z
    .string()
    .trim()
    .min(1, "Recipient name must not be empty")
    .max(200, "Recipient name must be at most 200 characters")
    .optional(),
});

const smsBodySchema = z
  .string()
  .trim()
  .min(1, "Body is required")
  .max(1600, "Body must be at most 1600 characters");

const smsMetadataSchema = z.record(z.unknown()).optional();

export const sendTestSmsNotificationSchema = z.object({
  storeId: storeIdSchema,
  to: smsRecipientSchema,
  body: smsBodySchema,
  provider: z.enum(SMS_PROVIDER_TYPES).default("console"),
  metadata: smsMetadataSchema,
});

export type SendTestSmsNotificationInput = z.infer<
  typeof sendTestSmsNotificationSchema
>;

export type SmsRecipientInput = z.infer<typeof smsRecipientSchema>;
