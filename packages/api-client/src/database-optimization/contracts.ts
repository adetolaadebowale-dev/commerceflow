import type {
  DatabaseDiagnostics,
  IndexSummary,
} from "@commerceflow/types";

import type { ApiSuccessResponse } from "../common/api-response";

export interface DatabaseOptimizationStoreParams {
  readonly storeId: string;
}

export type GetPlatformDatabaseResponse = ApiSuccessResponse<{
  readonly database: DatabaseDiagnostics;
}>;

export type GetPlatformDatabaseIndexesResponse = ApiSuccessResponse<{
  readonly indexes: IndexSummary;
}>;

export type GetPlatformDatabaseDiagnosticsResponse = ApiSuccessResponse<{
  readonly diagnostics: DatabaseDiagnostics;
}>;
