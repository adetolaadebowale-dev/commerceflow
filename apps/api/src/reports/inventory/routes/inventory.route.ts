import {
  inventoryLowStockQuerySchema,
  inventoryMovementQuerySchema,
  inventorySummaryQuerySchema,
  inventoryValuationQuerySchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { REPORTS_ERROR_CODES, ReportsError } from "../../errors";
import { handleReportsRouteError, jsonSuccess } from "../../routes/http-response";
import { getQueryParams, getRepeatedQueryParams } from "../../routes/request-utils";
import { inventoryReportsService } from "../services";

function parseInventoryFilterQuery(request: Request) {
  const params = getQueryParams(request);
  const warehouseIds = getRepeatedQueryParams(request, "warehouseIds");
  const productVariantIds = getRepeatedQueryParams(request, "productVariantIds");
  const supplierIds = getRepeatedQueryParams(request, "supplierIds");

  return {
    params,
    warehouseIds,
    productVariantIds,
    supplierIds,
  };
}

export async function handleGetInventorySummary(
  request: Request,
): Promise<Response> {
  try {
    const { params, warehouseIds, productVariantIds, supplierIds } =
      parseInventoryFilterQuery(request);
    const parsed = inventorySummaryQuerySchema.safeParse({
      ...params,
      warehouseIds,
      productVariantIds,
      supplierIds,
    });

    if (!parsed.success) {
      throw new ReportsError(
        REPORTS_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "reports:read",
    );

    const summary = await inventoryReportsService.getSummary(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "inventory_report",
      entityId: parsed.data.storeId,
      action: "generate_summary",
      metadata: {
        itemCount: summary.byProductVariant.length,
        lowStockCount: summary.lowStockItems.length,
      },
    });

    return jsonSuccess(summary);
  } catch (error) {
    return handleReportsRouteError(error);
  }
}

export async function handleGetInventoryMovements(
  request: Request,
): Promise<Response> {
  try {
    const { params, warehouseIds, productVariantIds, supplierIds } =
      parseInventoryFilterQuery(request);
    const parsed = inventoryMovementQuerySchema.safeParse({
      ...params,
      warehouseIds,
      productVariantIds,
      supplierIds,
    });

    if (!parsed.success) {
      throw new ReportsError(
        REPORTS_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "reports:read",
    );

    const report = await inventoryReportsService.getStockMovements(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "inventory_report",
      entityId: parsed.data.storeId,
      action: "generate_movements",
      metadata: {
        movementCount: report.totals.movementCount,
        page: report.pagination.page,
      },
    });

    return jsonSuccess(report);
  } catch (error) {
    return handleReportsRouteError(error);
  }
}

export async function handleGetLowStockReport(
  request: Request,
): Promise<Response> {
  try {
    const { params, warehouseIds, productVariantIds, supplierIds } =
      parseInventoryFilterQuery(request);
    const parsed = inventoryLowStockQuerySchema.safeParse({
      ...params,
      warehouseIds,
      productVariantIds,
      supplierIds,
    });

    if (!parsed.success) {
      throw new ReportsError(
        REPORTS_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "reports:read",
    );

    const report = await inventoryReportsService.getLowStockReport(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "inventory_report",
      entityId: parsed.data.storeId,
      action: "generate_low_stock",
      metadata: {
        lowStockCount: report.lowStockItems.length,
        outOfStockCount: report.outOfStockItems.length,
      },
    });

    return jsonSuccess(report);
  } catch (error) {
    return handleReportsRouteError(error);
  }
}

export async function handleGetInventoryValuation(
  request: Request,
): Promise<Response> {
  try {
    const { params, warehouseIds, productVariantIds, supplierIds } =
      parseInventoryFilterQuery(request);
    const parsed = inventoryValuationQuerySchema.safeParse({
      ...params,
      warehouseIds,
      productVariantIds,
      supplierIds,
    });

    if (!parsed.success) {
      throw new ReportsError(
        REPORTS_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "reports:read",
    );

    const report = await inventoryReportsService.getValuation(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "inventory_report",
      entityId: parsed.data.storeId,
      action: "generate_valuation",
      metadata: {
        totalValue: report.totalValue,
        currency: report.currency,
      },
    });

    return jsonSuccess(report);
  } catch (error) {
    return handleReportsRouteError(error);
  }
}
