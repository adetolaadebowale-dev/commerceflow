import type { AuditLog, CatalogueListResult } from "@commerceflow/types";
import type { ListAuditLogsQuery } from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

/** GET /audit-logs */
export type ListAuditLogsResponse = ApiSuccessResponse<
  CatalogueListResult<AuditLog>
>;

/** GET /audit-logs/:id */
export type GetAuditLogResponse = ApiSuccessResponse<{
  auditLog: AuditLog;
}>;

export interface StoreScopedParams {
  readonly storeId: string;
}

export interface ListAuditLogsParams extends ListAuditLogsQuery {}
