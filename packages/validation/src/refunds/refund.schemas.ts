import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

export const createRefundSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "Reason is required")
    .max(500, "Reason must be at most 500 characters"),
});

export const refundIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export const paymentRefundActionSchema = refundIdQuerySchema;

export const listPaymentRefundsQuerySchema = refundIdQuerySchema;

export type CreateRefundInput = z.infer<typeof createRefundSchema>;
export type RefundIdQuery = z.infer<typeof refundIdQuerySchema>;
export type PaymentRefundActionQuery = z.infer<typeof paymentRefundActionSchema>;
export type ListPaymentRefundsQuery = z.infer<typeof listPaymentRefundsQuerySchema>;
