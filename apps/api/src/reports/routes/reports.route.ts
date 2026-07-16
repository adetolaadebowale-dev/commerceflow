import {
  reportDashboardQuerySchema,
  reportHealthQuerySchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { REPORTS_ERROR_CODES, ReportsError } from "../errors";
import { reportsService } from "../services";
import { handleReportsRouteError, jsonSuccess } from "./http-response";
import { getQueryParams, getRepeatedQueryParams } from "./request-utils";

function parseDashboardQuery(request: Request) {
  const params = getQueryParams(request);
  const warehouseIds = getRepeatedQueryParams(request, "warehouseIds");

  return reportDashboardQuerySchema.safeParse({
    ...params,
    warehouseIds,
  });
}

export async function handleGetReportHealth(request: Request): Promise<Response> {
  try {
    const parsed = reportHealthQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new ReportsError(
        REPORTS_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "reports:read",
    );

    const health = await reportsService.getHealth(parsed.data);

    return jsonSuccess(health);
  } catch (error) {
    return handleReportsRouteError(error);
  }
}

export async function handleGetReportDashboard(
  request: Request,
): Promise<Response> {
  try {
    const parsed = parseDashboardQuery(request);

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

    const dashboard = await reportsService.getDashboard(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "report",
      entityId: parsed.data.storeId,
      action: "generate",
      metadata: {
        rowCount: dashboard.summary.rowCount,
        metricCount: dashboard.metrics.length,
      },
    });

    auditService.recordFromAuthContext(authContext, {
      entityType: "report",
      entityId: parsed.data.storeId,
      action: "view_dashboard",
      metadata: {
        timezone: dashboard.timezone,
        currency: dashboard.currency,
      },
    });

    return jsonSuccess(dashboard);
  } catch (error) {
    return handleReportsRouteError(error);
  }
}
