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

import type {
  FinancialSummary,
  InvoiceReport,
  PaymentReport,
  RefundReport,
  RevenueTimelineReport,
} from "@commerceflow/types";
import type {
  FinancialSummaryQuery,
  InvoiceReportQuery,
  PaymentReportQuery,
  RefundReportQuery,
  RevenueTimelineQuery,
} from "@commerceflow/validation";

export type FinancialSummaryParams = FinancialSummaryQuery;
export type RevenueTimelineParams = RevenueTimelineQuery;
export type PaymentReportParams = PaymentReportQuery;
export type InvoiceReportParams = InvoiceReportQuery;
export type RefundReportParams = RefundReportQuery;

export type GetFinancialSummaryResponse = ApiSuccessResponse<FinancialSummary>;
export type GetRevenueTimelineResponse = ApiSuccessResponse<RevenueTimelineReport>;
export type GetPaymentReportResponse = ApiSuccessResponse<PaymentReport>;
export type GetInvoiceReportResponse = ApiSuccessResponse<InvoiceReport>;
export type GetRefundReportResponse = ApiSuccessResponse<RefundReport>;

import type {
  ProcurementSummary,
  PurchaseOrderAnalytics,
  ReplenishmentAnalytics,
  SupplierAnalytics,
  WarehouseAnalytics,
} from "@commerceflow/types";
import type {
  ProcurementSummaryQuery,
  PurchaseOrderAnalyticsQuery,
  ReplenishmentAnalyticsQuery,
  SupplierAnalyticsQuery,
  WarehouseAnalyticsQuery,
} from "@commerceflow/validation";

export type ProcurementSummaryParams = ProcurementSummaryQuery;
export type PurchaseOrderAnalyticsParams = PurchaseOrderAnalyticsQuery;
export type SupplierAnalyticsParams = SupplierAnalyticsQuery;
export type WarehouseAnalyticsParams = WarehouseAnalyticsQuery;
export type ReplenishmentAnalyticsParams = ReplenishmentAnalyticsQuery;

export type GetProcurementSummaryResponse = ApiSuccessResponse<ProcurementSummary>;
export type GetPurchaseOrderAnalyticsResponse =
  ApiSuccessResponse<PurchaseOrderAnalytics>;
export type GetSupplierAnalyticsResponse = ApiSuccessResponse<SupplierAnalytics>;
export type GetWarehouseAnalyticsResponse = ApiSuccessResponse<WarehouseAnalytics>;
export type GetReplenishmentAnalyticsResponse =
  ApiSuccessResponse<ReplenishmentAnalytics>;

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
