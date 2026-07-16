import { PURCHASE_ORDER_STATUSES } from "@commerceflow/types";
import { z } from "zod";

import {
  reportFilterBaseSchema,
  reportPaginationSchema,
  reportSortSchema,
  validateReportDateOrder,
} from "../reports.schemas";

const supplierIdsSchema = z
  .array(z.string().uuid("Supplier id must be a valid UUID"))
  .min(1)
  .optional();

const purchaseOrderStatusFilterSchema = z
  .enum(PURCHASE_ORDER_STATUSES)
  .optional();

const procurementFilterExtensions = {
  supplierIds: supplierIdsSchema,
  purchaseOrderStatus: purchaseOrderStatusFilterSchema,
};

export const procurementSummaryQuerySchema = reportFilterBaseSchema
  .extend(procurementFilterExtensions)
  .refine(
    validateReportDateOrder,
    "fromDate must be before or equal to toDate",
  );

export const purchaseOrderAnalyticsQuerySchema = reportFilterBaseSchema
  .merge(reportPaginationSchema)
  .merge(reportSortSchema)
  .extend(procurementFilterExtensions)
  .refine(
    validateReportDateOrder,
    "fromDate must be before or equal to toDate",
  );

export const supplierAnalyticsQuerySchema = reportFilterBaseSchema
  .merge(reportPaginationSchema)
  .merge(reportSortSchema)
  .extend(procurementFilterExtensions)
  .refine(
    validateReportDateOrder,
    "fromDate must be before or equal to toDate",
  );

export const warehouseAnalyticsQuerySchema = reportFilterBaseSchema
  .merge(reportPaginationSchema)
  .merge(reportSortSchema)
  .extend(procurementFilterExtensions)
  .refine(
    validateReportDateOrder,
    "fromDate must be before or equal to toDate",
  );

export const replenishmentAnalyticsQuerySchema = reportFilterBaseSchema
  .merge(reportPaginationSchema)
  .merge(reportSortSchema)
  .extend(procurementFilterExtensions)
  .refine(
    validateReportDateOrder,
    "fromDate must be before or equal to toDate",
  );

export type ProcurementSummaryQuery = z.infer<
  typeof procurementSummaryQuerySchema
>;
export type PurchaseOrderAnalyticsQuery = z.infer<
  typeof purchaseOrderAnalyticsQuerySchema
>;
export type SupplierAnalyticsQuery = z.infer<
  typeof supplierAnalyticsQuerySchema
>;
export type WarehouseAnalyticsQuery = z.infer<
  typeof warehouseAnalyticsQuerySchema
>;
export type ReplenishmentAnalyticsQuery = z.infer<
  typeof replenishmentAnalyticsQuerySchema
>;
