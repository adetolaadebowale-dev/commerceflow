import {
  financialSummaryQuerySchema,
  invoiceReportQuerySchema,
  paymentReportQuerySchema,
  refundReportQuerySchema,
  revenueTimelineQuerySchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { REPORTS_ERROR_CODES, ReportsError } from "../../errors";
import { handleReportsRouteError, jsonSuccess } from "../../routes/http-response";
import { getQueryParams, getRepeatedQueryParams } from "../../routes/request-utils";
import { financialReportsService } from "../services";

function parseFinancialFilterQuery(request: Request) {
  const params = getQueryParams(request);
  const warehouseIds = getRepeatedQueryParams(request, "warehouseIds");

  return {
    params,
    warehouseIds,
  };
}

function parseSummaryQuery(request: Request) {
  const { params, warehouseIds } = parseFinancialFilterQuery(request);

  return financialSummaryQuerySchema.safeParse({
    ...params,
    warehouseIds,
  });
}

function parseRevenueQuery(request: Request) {
  const { params, warehouseIds } = parseFinancialFilterQuery(request);

  return revenueTimelineQuerySchema.safeParse({
    ...params,
    warehouseIds,
  });
}

function parsePaymentsQuery(request: Request) {
  const { params, warehouseIds } = parseFinancialFilterQuery(request);

  return paymentReportQuerySchema.safeParse({
    ...params,
    warehouseIds,
  });
}

function parseInvoicesQuery(request: Request) {
  const { params, warehouseIds } = parseFinancialFilterQuery(request);

  return invoiceReportQuerySchema.safeParse({
    ...params,
    warehouseIds,
  });
}

function parseRefundsQuery(request: Request) {
  const { params, warehouseIds } = parseFinancialFilterQuery(request);

  return refundReportQuerySchema.safeParse({
    ...params,
    warehouseIds,
  });
}

export async function handleGetFinancialSummary(
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

    const summary = await financialReportsService.getSummary(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "financial_report",
      entityId: parsed.data.storeId,
      action: "generate_summary",
      metadata: {
        grossRevenue: summary.metrics.grossRevenue,
        netRevenue: summary.metrics.netRevenue,
        currency: summary.metrics.currency,
      },
    });

    return jsonSuccess(summary);
  } catch (error) {
    return handleReportsRouteError(error);
  }
}

export async function handleGetRevenueTimeline(
  request: Request,
): Promise<Response> {
  try {
    const parsed = parseRevenueQuery(request);

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

    const timeline = await financialReportsService.getRevenueTimeline(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "financial_report",
      entityId: parsed.data.storeId,
      action: "generate_revenue",
      metadata: {
        granularity: timeline.granularity,
        pointCount: timeline.points.length,
      },
    });

    return jsonSuccess(timeline);
  } catch (error) {
    return handleReportsRouteError(error);
  }
}

export async function handleGetPaymentReport(
  request: Request,
): Promise<Response> {
  try {
    const parsed = parsePaymentsQuery(request);

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

    const report = await financialReportsService.getPaymentReport(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "financial_report",
      entityId: parsed.data.storeId,
      action: "generate_payments",
      metadata: {
        totalItems: report.pagination.totalItems,
        paymentCount: report.summary.paymentCount,
      },
    });

    return jsonSuccess(report);
  } catch (error) {
    return handleReportsRouteError(error);
  }
}

export async function handleGetInvoiceReport(
  request: Request,
): Promise<Response> {
  try {
    const parsed = parseInvoicesQuery(request);

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

    const report = await financialReportsService.getInvoiceReport(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "financial_report",
      entityId: parsed.data.storeId,
      action: "generate_invoices",
      metadata: {
        totalItems: report.pagination.totalItems,
        invoiceCount: report.summary.invoiceCount,
      },
    });

    return jsonSuccess(report);
  } catch (error) {
    return handleReportsRouteError(error);
  }
}

export async function handleGetRefundReport(
  request: Request,
): Promise<Response> {
  try {
    const parsed = parseRefundsQuery(request);

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

    const report = await financialReportsService.getRefundReport(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "financial_report",
      entityId: parsed.data.storeId,
      action: "generate_refunds",
      metadata: {
        totalItems: report.pagination.totalItems,
        refundCount: report.summary.refundCount,
      },
    });

    return jsonSuccess(report);
  } catch (error) {
    return handleReportsRouteError(error);
  }
}
