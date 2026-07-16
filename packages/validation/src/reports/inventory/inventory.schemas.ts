import { STOCK_MOVEMENT_TYPES } from "@commerceflow/types";
import { z } from "zod";

import {
  reportFilterBaseSchema,
  reportPaginationSchema,
  reportSortSchema,
  validateReportDateOrder,
} from "../reports.schemas";

const productVariantIdsSchema = z
  .array(z.string().uuid("Product variant id must be a valid UUID"))
  .min(1)
  .optional();

const supplierIdsSchema = z
  .array(z.string().uuid("Supplier id must be a valid UUID"))
  .min(1)
  .optional();

const inventoryFilterExtensions = {
  productVariantIds: productVariantIdsSchema,
  supplierIds: supplierIdsSchema,
};

export const inventorySummaryQuerySchema = reportFilterBaseSchema
  .extend(inventoryFilterExtensions)
  .refine(
    validateReportDateOrder,
    "fromDate must be before or equal to toDate",
  );

export const inventoryMovementQuerySchema = reportFilterBaseSchema
  .merge(reportPaginationSchema)
  .merge(reportSortSchema)
  .extend({
    ...inventoryFilterExtensions,
    movementType: z.enum(STOCK_MOVEMENT_TYPES).optional(),
  })
  .refine(
    validateReportDateOrder,
    "fromDate must be before or equal to toDate",
  );

export const inventoryLowStockQuerySchema = reportFilterBaseSchema
  .merge(reportPaginationSchema)
  .extend(inventoryFilterExtensions)
  .refine(
    validateReportDateOrder,
    "fromDate must be before or equal to toDate",
  );

export const inventoryValuationQuerySchema = reportFilterBaseSchema
  .merge(reportPaginationSchema)
  .merge(reportSortSchema)
  .extend(inventoryFilterExtensions)
  .refine(
    validateReportDateOrder,
    "fromDate must be before or equal to toDate",
  );

export type InventorySummaryQuery = z.infer<typeof inventorySummaryQuerySchema>;
export type InventoryMovementQuery = z.infer<typeof inventoryMovementQuerySchema>;
export type InventoryLowStockQuery = z.infer<typeof inventoryLowStockQuerySchema>;
export type InventoryValuationQuery = z.infer<
  typeof inventoryValuationQuerySchema
>;
