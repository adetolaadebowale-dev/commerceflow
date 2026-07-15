import { PAYMENT_PROVIDERS } from "@commerceflow/types";
import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

const metadataSchema = z.record(z.string(), z.unknown()).optional();

export const createPaymentSchema = z.object({
  provider: z.enum(PAYMENT_PROVIDERS).default("internal"),
  metadata: metadataSchema,
});

export const paymentIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export const orderPaymentActionSchema = paymentIdQuerySchema;

export const listOrderPaymentsQuerySchema = paymentIdQuerySchema;

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type PaymentIdQuery = z.infer<typeof paymentIdQuerySchema>;
export type OrderPaymentActionQuery = z.infer<typeof orderPaymentActionSchema>;
export type ListOrderPaymentsQuery = z.infer<typeof listOrderPaymentsQuerySchema>;
