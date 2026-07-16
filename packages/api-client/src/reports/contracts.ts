import type {
  InventoryMovementReport,
  InventorySummary,
  InventoryValuationReport,
  LowStockReport,
  SalesOrdersReport,
  SalesSummary,
  SalesTimelineReport,
} from "@commerceflow/types";
import type {
  InventoryLowStockQuery,
  InventoryMovementQuery,
  InventorySummaryQuery,
  InventoryValuationQuery,
  SalesOrderReportQuery,
  SalesSummaryQuery,
  SalesTimelineQuery,
} from "@commerceflow/validation";

import type {
  CustomerGrowthReport,
  CustomerOrdersReport,
  CustomerSummary,
  TopCustomersReport,
} from "@commerceflow/types";
import type {
  CustomerGrowthQuery,
  CustomerOrdersQuery,
  CustomerSummaryQuery,
  TopCustomersQuery,
} from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

export type CustomerSummaryParams = CustomerSummaryQuery;
export type CustomerGrowthParams = CustomerGrowthQuery;
export type TopCustomersParams = TopCustomersQuery;
export type CustomerOrdersParams = CustomerOrdersQuery;

export type GetCustomerSummaryResponse = ApiSuccessResponse<CustomerSummary>;
export type GetCustomerGrowthResponse = ApiSuccessResponse<CustomerGrowthReport>;
export type GetTopCustomersResponse = ApiSuccessResponse<TopCustomersReport>;
export type GetCustomerOrdersResponse = ApiSuccessResponse<CustomerOrdersReport>;

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

export type InventorySummaryParams = InventorySummaryQuery;
export type InventoryMovementParams = InventoryMovementQuery;
export type InventoryLowStockParams = InventoryLowStockQuery;
export type InventoryValuationParams = InventoryValuationQuery;

export type GetInventorySummaryResponse = ApiSuccessResponse<InventorySummary>;
export type GetInventoryMovementResponse = ApiSuccessResponse<InventoryMovementReport>;
export type GetLowStockReportResponse = ApiSuccessResponse<LowStockReport>;
export type GetInventoryValuationResponse =
  ApiSuccessResponse<InventoryValuationReport>;
