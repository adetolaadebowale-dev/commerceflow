import type {
  GetReportDashboardResponse,
  GetReportHealthResponse,
  ReportDashboardParams,
  ReportHealthParams,
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
  };
}

export type ReportsClient = ReturnType<typeof createReportsClient>;
