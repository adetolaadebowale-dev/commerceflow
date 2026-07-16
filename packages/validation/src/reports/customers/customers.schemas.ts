import { z } from "zod";

import { CUSTOMER_STATUSES, ORDER_STATUSES } from "@commerceflow/types";

import {
  reportFilterBaseSchema,
  reportPaginationSchema,
  reportSortSchema,
  validateReportDateOrder,
} from "../reports.schemas";

const orderStatusFilterSchema = z.enum(ORDER_STATUSES).optional();
const customerStatusFilterSchema = z.enum(CUSTOMER_STATUSES).optional();

const customerGrowthGranularitySchema = z.enum(["day", "week", "month"]);

const customerFilterSchema = z.object({
  customerIds: z.array(z.string().uuid()).optional(),
  customerStatus: customerStatusFilterSchema,
});

export const customerSummaryQuerySchema = reportFilterBaseSchema
  .merge(customerFilterSchema)
  .extend({
    orderStatus: orderStatusFilterSchema,
  })
  .refine(
    validateReportDateOrder,
    "fromDate must be before or equal to toDate",
  );

export const customerGrowthQuerySchema = reportFilterBaseSchema
  .merge(customerFilterSchema)
  .extend({
    orderStatus: orderStatusFilterSchema,
    granularity: customerGrowthGranularitySchema.default("day"),
  })
  .refine(
    validateReportDateOrder,
    "fromDate must be before or equal to toDate",
  );

export const topCustomersQuerySchema = reportFilterBaseSchema
  .merge(reportPaginationSchema)
  .merge(reportSortSchema)
  .merge(customerFilterSchema)
  .extend({
    orderStatus: orderStatusFilterSchema,
  })
  .refine(
    validateReportDateOrder,
    "fromDate must be before or equal to toDate",
  );

export const customerOrdersQuerySchema = reportFilterBaseSchema
  .merge(reportPaginationSchema)
  .merge(reportSortSchema)
  .merge(customerFilterSchema)
  .extend({
    orderStatus: orderStatusFilterSchema,
  })
  .refine(
    validateReportDateOrder,
    "fromDate must be before or equal to toDate",
  );

export type CustomerSummaryQuery = z.infer<typeof customerSummaryQuerySchema>;
export type CustomerGrowthQuery = z.infer<typeof customerGrowthQuerySchema>;
export type TopCustomersQuery = z.infer<typeof topCustomersQuerySchema>;
export type CustomerOrdersQuery = z.infer<typeof customerOrdersQuerySchema>;
