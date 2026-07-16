import {
  customerGrowthQuerySchema,
  customerOrdersQuerySchema,
  customerSummaryQuerySchema,
  topCustomersQuerySchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { REPORTS_ERROR_CODES, ReportsError } from "../../errors";
import { handleReportsRouteError, jsonSuccess } from "../../routes/http-response";
import { getQueryParams, getRepeatedQueryParams } from "../../routes/request-utils";
import { customerReportsService } from "../services";

function parseCustomerFilterQuery(request: Request) {
  const params = getQueryParams(request);
  const customerIds = getRepeatedQueryParams(request, "customerIds");

  return {
    params,
    customerIds,
  };
}

function parseSummaryQuery(request: Request) {
  const { params, customerIds } = parseCustomerFilterQuery(request);

  return customerSummaryQuerySchema.safeParse({
    ...params,
    customerIds,
  });
}

function parseGrowthQuery(request: Request) {
  const { params, customerIds } = parseCustomerFilterQuery(request);

  return customerGrowthQuerySchema.safeParse({
    ...params,
    customerIds,
  });
}

function parseTopCustomersQuery(request: Request) {
  const { params, customerIds } = parseCustomerFilterQuery(request);

  return topCustomersQuerySchema.safeParse({
    ...params,
    customerIds,
  });
}

function parseCustomerOrdersQuery(request: Request) {
  const { params, customerIds } = parseCustomerFilterQuery(request);

  return customerOrdersQuerySchema.safeParse({
    ...params,
    customerIds,
  });
}

export async function handleGetCustomerSummary(
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

    const summary = await customerReportsService.getSummary(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "customer_report",
      entityId: parsed.data.storeId,
      action: "generate_summary",
      metadata: {
        totalCustomers: summary.metrics.totalCustomers,
        activeCustomers: summary.metrics.activeCustomers,
        lifetimeValue: summary.metrics.lifetimeValue,
      },
    });

    return jsonSuccess(summary);
  } catch (error) {
    return handleReportsRouteError(error);
  }
}

export async function handleGetCustomerGrowth(
  request: Request,
): Promise<Response> {
  try {
    const parsed = parseGrowthQuery(request);

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

    const growth = await customerReportsService.getGrowth(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "customer_report",
      entityId: parsed.data.storeId,
      action: "generate_growth",
      metadata: {
        granularity: growth.granularity,
        pointCount: growth.points.length,
      },
    });

    return jsonSuccess(growth);
  } catch (error) {
    return handleReportsRouteError(error);
  }
}

export async function handleGetTopCustomers(
  request: Request,
): Promise<Response> {
  try {
    const parsed = parseTopCustomersQuery(request);

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

    const topCustomers = await customerReportsService.getTopCustomers(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "customer_report",
      entityId: parsed.data.storeId,
      action: "generate_top_customers",
      metadata: {
        totalItems: topCustomers.pagination.totalItems,
        page: topCustomers.pagination.page,
        limit: topCustomers.pagination.limit,
      },
    });

    return jsonSuccess(topCustomers);
  } catch (error) {
    return handleReportsRouteError(error);
  }
}

export async function handleListCustomerOrders(
  request: Request,
): Promise<Response> {
  try {
    const parsed = parseCustomerOrdersQuery(request);

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

    const orders = await customerReportsService.listCustomerOrders(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "customer_report",
      entityId: parsed.data.storeId,
      action: "generate_customer_orders",
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
