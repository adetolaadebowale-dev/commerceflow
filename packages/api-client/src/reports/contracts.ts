import type {
  ReportDashboardResponse,
  ReportHealthResponse,
} from "@commerceflow/types";
import type {
  ReportDashboardQuery,
  ReportHealthQuery,
} from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

export type ReportHealthParams = ReportHealthQuery;
export type ReportDashboardParams = ReportDashboardQuery;

export type GetReportHealthResponse = ApiSuccessResponse<ReportHealthResponse>;
export type GetReportDashboardResponse =
  ApiSuccessResponse<ReportDashboardResponse>;
