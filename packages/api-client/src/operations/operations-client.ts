import type {
  GetFulfillmentDashboardResponse,
  GetInventoryHealthSummaryResponse,
  GetProcurementDashboardResponse,
  GetReadinessReportResponse,
  GetWarehouseOperationalSummaryResponse,
  OperationsStoreScopedParams,
  RunIntegrityCheckResponse,
  RunInventoryValidationResponse,
  RunPhase3ValidationResponse,
  RunWarehouseValidationResponse,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toQueryString(params: OperationsStoreScopedParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function createOperationsClient(config: ApiClientConfig) {
  return {
    getWarehouseOperationalSummary(
      params: OperationsStoreScopedParams,
    ): Promise<GetWarehouseOperationalSummaryResponse> {
      return apiRequest(config, {
        method: "GET",
        path: `/api/operations/warehouse-summary${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      });
    },

    getFulfillmentDashboard(
      params: OperationsStoreScopedParams,
    ): Promise<GetFulfillmentDashboardResponse> {
      return apiRequest(config, {
        method: "GET",
        path: `/api/operations/fulfillment-dashboard${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      });
    },

    getProcurementDashboard(
      params: OperationsStoreScopedParams,
    ): Promise<GetProcurementDashboardResponse> {
      return apiRequest(config, {
        method: "GET",
        path: `/api/operations/procurement-dashboard${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      });
    },

    getInventoryHealthSummary(
      params: OperationsStoreScopedParams,
    ): Promise<GetInventoryHealthSummaryResponse> {
      return apiRequest(config, {
        method: "GET",
        path: `/api/operations/inventory-health${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      });
    },

    runIntegrityCheck(
      params: OperationsStoreScopedParams,
    ): Promise<RunIntegrityCheckResponse> {
      return apiRequest(config, {
        method: "POST",
        path: "/api/operations/integrity-check",
        body: params,
        accessToken: config.getAccessToken?.(),
      });
    },

    runWarehouseValidation(
      params: OperationsStoreScopedParams,
    ): Promise<RunWarehouseValidationResponse> {
      return apiRequest(config, {
        method: "POST",
        path: "/api/operations/warehouse-validation",
        body: params,
        accessToken: config.getAccessToken?.(),
      });
    },

    runInventoryValidation(
      params: OperationsStoreScopedParams,
    ): Promise<RunInventoryValidationResponse> {
      return apiRequest(config, {
        method: "POST",
        path: "/api/operations/inventory-validation",
        body: params,
        accessToken: config.getAccessToken?.(),
      });
    },

    getReadinessReport(
      params: OperationsStoreScopedParams,
    ): Promise<GetReadinessReportResponse> {
      return apiRequest(config, {
        method: "GET",
        path: `/api/operations/readiness-report${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      });
    },

    runPhase3Validation(
      params: OperationsStoreScopedParams,
    ): Promise<RunPhase3ValidationResponse> {
      return apiRequest(config, {
        method: "POST",
        path: "/api/operations/run-phase3-validation",
        body: params,
        accessToken: config.getAccessToken?.(),
      });
    },
  };
}

export type OperationsClient = ReturnType<typeof createOperationsClient>;
