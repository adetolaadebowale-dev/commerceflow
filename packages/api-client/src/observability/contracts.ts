import type {
  LoggingDiagnostics,
  LoggingSummary,
} from "@commerceflow/types";

import type { ApiSuccessResponse } from "../common/api-response";

export interface ObservabilityStoreParams {
  readonly storeId: string;
}

export type GetPlatformLoggingResponse = ApiSuccessResponse<{
  readonly logging: LoggingSummary;
}>;

export type GetPlatformLoggingDiagnosticsResponse = ApiSuccessResponse<{
  readonly diagnostics: LoggingDiagnostics;
}>;
