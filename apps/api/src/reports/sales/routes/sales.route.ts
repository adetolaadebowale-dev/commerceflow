import {
  salesOrderReportQuerySchema,
  salesSummaryQuerySchema,
  salesTimelineQuerySchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { REPORTS_ERROR_CODES, ReportsError } from "../../errors";
import { handleReportsRouteError, jsonSuccess } from "../../routes/http-response";
import { getQueryParams, getRepeatedQueryParams } from "../../routes/request-utils";
import { salesReportsService } from "../services";

function parseSalesFilterQuery(request: Request) {
  const params = getQueryParams(request);
  const warehouseIds = getRepeatedQueryParams(request, "warehouseIds");

  return {
    params,
    warehouseIds,
  };
}

function parseSummaryQuery(request: Request) {
  const { params, warehouseIds } = parseSalesFilterQuery(request);

  return salesSummaryQuerySchema.safeParse({
    ...params,
    warehouseIds,
  });
}

function parseTimelineQuery(request: Request) {
  const { params, warehouseIds } = parseSalesFilterQuery(request);

  return salesTimelineQuerySchema.safeParse({
    ...params,
    warehouseIds,
  });
}

function parseOrdersQuery(request: Request) {
  const { params, warehouseIds } = parseSalesFilterQuery(request);

  return salesOrderReportQuerySchema.safeParse({
    ...params,
    warehouseIds,
  });
}

export async function handleGetSalesSummary(request: Request): Promise<Response> {
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

    const summary = await salesReportsService.getSummary(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "sales_report",
      entityId: parsed.data.storeId,
      action: "generate_summary",
      metadata: {
        orderCount: summary.metrics.orderCount,
        netSales: summary.metrics.netSales,
        currency: summary.metrics.currency,
      },
    });

    return jsonSuccess(summary);
  } catch (error) {
    return handleReportsRouteError(error);
  }
}

export async function handleGetSalesTimeline(
  request: Request,
): Promise<Response> {
  try {
    const parsed = parseTimelineQuery(request);

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

    const timeline = await salesReportsService.getTimeline(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "sales_report",
      entityId: parsed.data.storeId,
      action: "generate_timeline",
      metadata: {
        granularity: timeline.granularity,
        pointCount: timeline.points.length,
        timezone: timeline.timezone,
      },
    });

    return jsonSuccess(timeline);
  } catch (error) {
    return handleReportsRouteError(error);
  }
}

export async function handleListSalesOrders(request: Request): Promise<Response> {
  try {
    const parsed = parseOrdersQuery(request);

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

    const orders = await salesReportsService.listOrders(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "sales_report",
      entityId: parsed.data.storeId,
      action: "generate_orders",
      metadata: {
        totalItems: orders.pagination.totalItems,
        page: orders.pagination.page,
        limit: orders.pagination.limit,
      },
    });

    return jsonSuccess(orders);
  } catch (error) {
    return handleReportsRouteError(error);
  }
}
