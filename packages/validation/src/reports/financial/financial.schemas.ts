import { z } from "zod";

import { INVOICE_STATUSES, ORDER_STATUSES, PAYMENT_STATUSES } from "@commerceflow/types";

import {
  reportFilterBaseSchema,
  reportPaginationSchema,
  reportSortSchema,
  validateReportDateOrder,
} from "../reports.schemas";

const orderStatusFilterSchema = z.enum(ORDER_STATUSES).optional();
const paymentStatusFilterSchema = z.enum(PAYMENT_STATUSES).optional();
const invoiceStatusFilterSchema = z.enum(INVOICE_STATUSES).optional();
const revenueTimelineGranularitySchema = z.enum(["day", "week", "month"]);

export const financialSummaryQuerySchema = reportFilterBaseSchema
  .extend({
    orderStatus: orderStatusFilterSchema,
    paymentStatus: paymentStatusFilterSchema,
    invoiceStatus: invoiceStatusFilterSchema,
  })
  .refine(
    validateReportDateOrder,
    "fromDate must be before or equal to toDate",
  );

export const revenueTimelineQuerySchema = reportFilterBaseSchema
  .extend({
    orderStatus: orderStatusFilterSchema,
    paymentStatus: paymentStatusFilterSchema,
    invoiceStatus: invoiceStatusFilterSchema,
    granularity: revenueTimelineGranularitySchema.default("day"),
  })
  .refine(
    validateReportDateOrder,
    "fromDate must be before or equal to toDate",
  );

export const paymentReportQuerySchema = reportFilterBaseSchema
  .merge(reportPaginationSchema)
  .merge(reportSortSchema)
  .extend({
    paymentStatus: paymentStatusFilterSchema,
  })
  .refine(
    validateReportDateOrder,
    "fromDate must be before or equal to toDate",
  );

export const invoiceReportQuerySchema = reportFilterBaseSchema
  .merge(reportPaginationSchema)
  .merge(reportSortSchema)
  .extend({
    invoiceStatus: invoiceStatusFilterSchema,
  })
  .refine(
    validateReportDateOrder,
    "fromDate must be before or equal to toDate",
  );

export const refundReportQuerySchema = reportFilterBaseSchema
  .merge(reportPaginationSchema)
  .merge(reportSortSchema)
  .refine(
    validateReportDateOrder,
    "fromDate must be before or equal to toDate",
  );

export type FinancialSummaryQuery = z.infer<typeof financialSummaryQuerySchema>;
export type RevenueTimelineQuery = z.infer<typeof revenueTimelineQuerySchema>;
export type PaymentReportQuery = z.infer<typeof paymentReportQuerySchema>;
export type InvoiceReportQuery = z.infer<typeof invoiceReportQuerySchema>;
export type RefundReportQuery = z.infer<typeof refundReportQuerySchema>;
