import {
  dashboardKPIQuerySchema,
  executiveDashboardQuerySchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { REPORTS_ERROR_CODES, ReportsError } from "../../errors";
import { handleReportsRouteError, jsonSuccess } from "../../routes/http-response";
import { getQueryParams, getRepeatedQueryParams } from "../../routes/request-utils";
import { dashboardReportsService } from "../services";

function parseDashboardFilterQuery(request: Request) {
  const params = getQueryParams(request);
  const warehouseIds = getRepeatedQueryParams(request, "warehouseIds");

  return {
    params,
    warehouseIds,
  };
}

function parseExecutiveQuery(request: Request) {
  const { params, warehouseIds } = parseDashboardFilterQuery(request);

  return executiveDashboardQuerySchema.safeParse({
    ...params,
    warehouseIds,
  });
}

function parseKPIQuery(request: Request) {
  const { params, warehouseIds } = parseDashboardFilterQuery(request);

  return dashboardKPIQuerySchema.safeParse({
    ...params,
    warehouseIds,
  });
}

export async function handleGetExecutiveDashboard(
  request: Request,
): Promise<Response> {
  try {
    const parsed = parseExecutiveQuery(request);

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

    const dashboard = await dashboardReportsService.getExecutiveDashboard(
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "dashboard_report",
      entityId: parsed.data.storeId,
      action: "generate_executive",
      metadata: {
        sectionCount: dashboard.sections.length,
        grossRevenue: dashboard.executiveSummary.grossRevenue,
        currency: dashboard.executiveSummary.currency,
      },
    });

    return jsonSuccess(dashboard);
  } catch (error) {
    return handleReportsRouteError(error);
  }
}

export async function handleGetDashboardKPIs(
  request: Request,
): Promise<Response> {
  try {
    const parsed = parseKPIQuery(request);

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

    const report = await dashboardReportsService.getDashboardKPIs(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "dashboard_report",
      entityId: parsed.data.storeId,
      action: "generate_kpis",
      metadata: {
        totalItems: report.pagination.totalItems,
        kpiCount: report.items.length,
      },
    });

    return jsonSuccess(report);
  } catch (error) {
    return handleReportsRouteError(error);
  }
}
