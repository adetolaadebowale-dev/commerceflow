import { z } from "zod";

import { ORDER_STATUSES } from "@commerceflow/types";

import {
  reportFilterBaseSchema,
  reportPaginationSchema,
  reportSortSchema,
  validateReportDateOrder,
} from "../reports.schemas";

const orderStatusFilterSchema = z.enum(ORDER_STATUSES).optional();

const salesTimelineGranularitySchema = z.enum(["day", "week", "month"]);

export const salesSummaryQuerySchema = reportFilterBaseSchema
  .extend({
    orderStatus: orderStatusFilterSchema,
  })
  .refine(
    validateReportDateOrder,
    "fromDate must be before or equal to toDate",
  );

export const salesTimelineQuerySchema = reportFilterBaseSchema
  .extend({
    orderStatus: orderStatusFilterSchema,
    granularity: salesTimelineGranularitySchema.default("day"),
  })
  .refine(
    validateReportDateOrder,
    "fromDate must be before or equal to toDate",
  );

export const salesOrderReportQuerySchema = reportFilterBaseSchema
  .merge(reportPaginationSchema)
  .merge(reportSortSchema)
  .extend({
    orderStatus: orderStatusFilterSchema,
  })
  .refine(
    validateReportDateOrder,
    "fromDate must be before or equal to toDate",
  );

export type SalesSummaryQuery = z.infer<typeof salesSummaryQuerySchema>;
export type SalesTimelineQuery = z.infer<typeof salesTimelineQuerySchema>;
export type SalesOrderReportQuery = z.infer<typeof salesOrderReportQuerySchema>;
