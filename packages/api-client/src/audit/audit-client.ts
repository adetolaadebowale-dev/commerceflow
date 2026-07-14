import type {
  GetAuditLogResponse,
  ListAuditLogsParams,
  ListAuditLogsResponse,
  StoreScopedParams,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toQueryString(
  params: ListAuditLogsParams | StoreScopedParams,
): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export interface AuditClient {
  listAuditLogs(
    params: ListAuditLogsParams,
  ): Promise<ListAuditLogsResponse["data"]>;
  getAuditLog(
    id: string,
    params: StoreScopedParams,
  ): Promise<GetAuditLogResponse["data"]>;
}

export function createAuditClient(config: ApiClientConfig): AuditClient {
  return {
    listAuditLogs: (params) =>
      apiRequest<ListAuditLogsResponse["data"]>(config, {
        method: "GET",
        path: `/api/audit-logs${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getAuditLog: (id, params) =>
      apiRequest<GetAuditLogResponse["data"]>(config, {
        method: "GET",
        path: `/api/audit-logs/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
