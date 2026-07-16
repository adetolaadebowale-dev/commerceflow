import {
  procurementSummaryQuerySchema,
  purchaseOrderAnalyticsQuerySchema,
  replenishmentAnalyticsQuerySchema,
  supplierAnalyticsQuerySchema,
  warehouseAnalyticsQuerySchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { REPORTS_ERROR_CODES, ReportsError } from "../../errors";
import { handleReportsRouteError, jsonSuccess } from "../../routes/http-response";
import { getQueryParams, getRepeatedQueryParams } from "../../routes/request-utils";
import { procurementReportsService } from "../services";

function parseProcurementFilterQuery(request: Request) {
  const params = getQueryParams(request);
  const warehouseIds = getRepeatedQueryParams(request, "warehouseIds");
  const supplierIds = getRepeatedQueryParams(request, "supplierIds");

  return {
    params,
    warehouseIds,
    supplierIds,
  };
}

function parseSummaryQuery(request: Request) {
  const { params, warehouseIds, supplierIds } = parseProcurementFilterQuery(request);

  return procurementSummaryQuerySchema.safeParse({
    ...params,
    warehouseIds,
    supplierIds,
  });
}

function parsePurchaseOrdersQuery(request: Request) {
  const { params, warehouseIds, supplierIds } = parseProcurementFilterQuery(request);

  return purchaseOrderAnalyticsQuerySchema.safeParse({
    ...params,
    warehouseIds,
    supplierIds,
  });
}

function parseSuppliersQuery(request: Request) {
  const { params, warehouseIds, supplierIds } = parseProcurementFilterQuery(request);

  return supplierAnalyticsQuerySchema.safeParse({
    ...params,
    warehouseIds,
    supplierIds,
  });
}

function parseWarehousesQuery(request: Request) {
  const { params, warehouseIds, supplierIds } = parseProcurementFilterQuery(request);

  return warehouseAnalyticsQuerySchema.safeParse({
    ...params,
    warehouseIds,
    supplierIds,
  });
}

function parseReplenishmentQuery(request: Request) {
  const { params, warehouseIds, supplierIds } = parseProcurementFilterQuery(request);

  return replenishmentAnalyticsQuerySchema.safeParse({
    ...params,
    warehouseIds,
    supplierIds,
  });
}

export async function handleGetProcurementSummary(
  request: Request,
): Promise<Response> {
  try {
    const parsed = parseSummaryQuery(request);

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

    const summary = await procurementReportsService.getSummary(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "procurement_report",
      entityId: parsed.data.storeId,
      action: "generate_summary",
      metadata: {
        purchaseOrderCount: summary.metrics.purchaseOrderCount,
        purchaseOrderValue: summary.metrics.purchaseOrderValue,
        currency: summary.metrics.currency,
      },
    });

    return jsonSuccess(summary);
  } catch (error) {
    return handleReportsRouteError(error);
  }
}

export async function handleGetPurchaseOrderAnalytics(
  request: Request,
): Promise<Response> {
  try {
    const parsed = parsePurchaseOrdersQuery(request);

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

    const report = await procurementReportsService.getPurchaseOrderAnalytics(
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "procurement_report",
      entityId: parsed.data.storeId,
      action: "generate_purchase_orders",
      metadata: {
        totalItems: report.pagination.totalItems,
        purchaseOrderCount: report.summary.purchaseOrderCount,
      },
    });

    return jsonSuccess(report);
  } catch (error) {
    return handleReportsRouteError(error);
  }
}

export async function handleGetSupplierAnalytics(
  request: Request,
): Promise<Response> {
  try {
    const parsed = parseSuppliersQuery(request);

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

    const report = await procurementReportsService.getSupplierAnalytics(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "procurement_report",
      entityId: parsed.data.storeId,
      action: "generate_suppliers",
      metadata: {
        totalItems: report.pagination.totalItems,
        supplierCount: report.summary.supplierCount,
      },
    });

    return jsonSuccess(report);
  } catch (error) {
    return handleReportsRouteError(error);
  }
}

export async function handleGetWarehouseAnalytics(
  request: Request,
): Promise<Response> {
  try {
    const parsed = parseWarehousesQuery(request);

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

    const report = await procurementReportsService.getWarehouseAnalytics(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "procurement_report",
      entityId: parsed.data.storeId,
      action: "generate_warehouses",
      metadata: {
        totalItems: report.pagination.totalItems,
        warehouseCount: report.summary.warehouseCount,
      },
    });

    return jsonSuccess(report);
  } catch (error) {
    return handleReportsRouteError(error);
  }
}

export async function handleGetReplenishmentAnalytics(
  request: Request,
): Promise<Response> {
  try {
    const parsed = parseReplenishmentQuery(request);

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

    const report = await procurementReportsService.getReplenishmentAnalytics(
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "procurement_report",
      entityId: parsed.data.storeId,
      action: "generate_replenishment",
      metadata: {
        totalItems: report.pagination.totalItems,
        recommendationCount: report.summary.recommendationCount,
      },
    });

    return jsonSuccess(report);
  } catch (error) {
    return handleReportsRouteError(error);
  }
}
