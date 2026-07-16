import type {
  SalesOrdersReport,
  SalesSummary,
  SalesTimelineReport,
} from "@commerceflow/types";
import type {
  SalesOrderReportQuery,
  SalesSummaryQuery,
  SalesTimelineQuery,
} from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

export type ReportHealthParams = import("@commerceflow/validation").ReportHealthQuery;
export type ReportDashboardParams =
  import("@commerceflow/validation").ReportDashboardQuery;

export type SalesSummaryParams = SalesSummaryQuery;
export type SalesTimelineParams = SalesTimelineQuery;
export type SalesOrderReportParams = SalesOrderReportQuery;

export type GetReportHealthResponse = ApiSuccessResponse<
  import("@commerceflow/types").ReportHealthResponse
>;
export type GetReportDashboardResponse =
  ApiSuccessResponse<import("@commerceflow/types").ReportDashboardResponse>;

export type GetSalesSummaryResponse = ApiSuccessResponse<SalesSummary>;
export type GetSalesTimelineResponse = ApiSuccessResponse<SalesTimelineReport>;
export type GetSalesOrdersReportResponse = ApiSuccessResponse<SalesOrdersReport>;
