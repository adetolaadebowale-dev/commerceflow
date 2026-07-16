import type {
  GetReportDashboardResponse,
  GetReportHealthResponse,
  GetSalesOrdersReportResponse,
  GetSalesSummaryResponse,
  GetSalesTimelineResponse,
  ReportDashboardParams,
  ReportHealthParams,
  SalesOrderReportParams,
  SalesSummaryParams,
  SalesTimelineParams,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function appendQueryParam(
  searchParams: URLSearchParams,
  key: string,
  value: string | number | undefined,
): void {
  if (value === undefined) {
    return;
  }

  searchParams.set(key, String(value));
}

function toDashboardQueryString(params: ReportDashboardParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  appendQueryParam(searchParams, "page", params.page);
  appendQueryParam(searchParams, "limit", params.limit);
  appendQueryParam(searchParams, "fromDate", params.fromDate);
  appendQueryParam(searchParams, "toDate", params.toDate);
  appendQueryParam(searchParams, "timezone", params.timezone);
  appendQueryParam(searchParams, "currency", params.currency);
  appendQueryParam(searchParams, "sortBy", params.sortBy);
  appendQueryParam(searchParams, "sortDirection", params.sortDirection);
  appendQueryParam(searchParams, "groupBy", params.groupBy);

  for (const warehouseId of params.warehouseIds ?? []) {
    searchParams.append("warehouseIds", warehouseId);
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toHealthQueryString(params: ReportHealthParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function appendSalesFilterParams(
  searchParams: URLSearchParams,
  params: {
    storeId: string;
    fromDate?: string;
    toDate?: string;
    timezone?: string;
    currency?: string;
    orderStatus?: string;
    warehouseIds?: readonly string[];
  },
): void {
  searchParams.set("storeId", params.storeId);
  appendQueryParam(searchParams, "fromDate", params.fromDate);
  appendQueryParam(searchParams, "toDate", params.toDate);
  appendQueryParam(searchParams, "timezone", params.timezone);
  appendQueryParam(searchParams, "currency", params.currency);
  appendQueryParam(searchParams, "orderStatus", params.orderStatus);

  for (const warehouseId of params.warehouseIds ?? []) {
    searchParams.append("warehouseIds", warehouseId);
  }
}

function toSalesSummaryQueryString(params: SalesSummaryParams): string {
  const searchParams = new URLSearchParams();
  appendSalesFilterParams(searchParams, params);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toSalesTimelineQueryString(params: SalesTimelineParams): string {
  const searchParams = new URLSearchParams();
  appendSalesFilterParams(searchParams, params);
  appendQueryParam(searchParams, "granularity", params.granularity);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toSalesOrdersQueryString(params: SalesOrderReportParams): string {
  const searchParams = new URLSearchParams();
  appendSalesFilterParams(searchParams, params);
  appendQueryParam(searchParams, "page", params.page);
  appendQueryParam(searchParams, "limit", params.limit);
  appendQueryParam(searchParams, "sortBy", params.sortBy);
  appendQueryParam(searchParams, "sortDirection", params.sortDirection);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function createReportsClient(config: ApiClientConfig) {
  return {
    getHealth(params: ReportHealthParams): Promise<GetReportHealthResponse> {
      return apiRequest(config, {
        method: "GET",
        path: `/api/reports/health${toHealthQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      });
    },

    getDashboard(
      params: ReportDashboardParams,
    ): Promise<GetReportDashboardResponse> {
      return apiRequest(config, {
        method: "GET",
        path: `/api/reports/dashboard${toDashboardQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      });
    },

    getSalesSummary(
      params: SalesSummaryParams,
    ): Promise<GetSalesSummaryResponse> {
      return apiRequest(config, {
        method: "GET",
        path: `/api/reports/sales/summary${toSalesSummaryQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      });
    },

    getSalesTimeline(
      params: SalesTimelineParams,
    ): Promise<GetSalesTimelineResponse> {
      return apiRequest(config, {
        method: "GET",
        path: `/api/reports/sales/timeline${toSalesTimelineQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      });
    },

    listSalesOrders(
      params: SalesOrderReportParams,
    ): Promise<GetSalesOrdersReportResponse> {
      return apiRequest(config, {
        method: "GET",
        path: `/api/reports/sales/orders${toSalesOrdersQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      });
    },
  };
}

export type ReportsClient = ReturnType<typeof createReportsClient>;
