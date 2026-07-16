import { z } from "zod";

import {
  reportFilterBaseSchema,
  reportPaginationSchema,
  validateReportDateOrder,
} from "../reports.schemas";

export const executiveDashboardQuerySchema = reportFilterBaseSchema.refine(
  validateReportDateOrder,
  "fromDate must be before or equal to toDate",
);

export const dashboardKPIQuerySchema = reportFilterBaseSchema
  .merge(reportPaginationSchema)
  .refine(
    validateReportDateOrder,
    "fromDate must be before or equal to toDate",
  );

export type ExecutiveDashboardQuery = z.infer<
  typeof executiveDashboardQuerySchema
>;
export type DashboardKPIQuery = z.infer<typeof dashboardKPIQuerySchema>;
