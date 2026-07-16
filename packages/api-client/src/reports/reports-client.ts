import type {
  GetReportDashboardResponse,
  GetReportHealthResponse,
  GetSalesOrdersReportResponse,
  GetSalesSummaryResponse,
  GetSalesTimelineResponse,
  GetInventorySummaryResponse,
  GetInventoryMovementResponse,
  GetLowStockReportResponse,
  GetInventoryValuationResponse,
  CustomerSummaryParams,
  CustomerGrowthParams,
  TopCustomersParams,
  CustomerOrdersParams,
  GetCustomerSummaryResponse,
  GetCustomerGrowthResponse,
  GetTopCustomersResponse,
  GetCustomerOrdersResponse,
  FinancialSummaryParams,
  RevenueTimelineParams,
  PaymentReportParams,
  InvoiceReportParams,
  RefundReportParams,
  GetFinancialSummaryResponse,
  GetRevenueTimelineResponse,
  GetPaymentReportResponse,
  GetInvoiceReportResponse,
  GetRefundReportResponse,
  ProcurementSummaryParams,
  PurchaseOrderAnalyticsParams,
  SupplierAnalyticsParams,
  WarehouseAnalyticsParams,
  ReplenishmentAnalyticsParams,
  GetProcurementSummaryResponse,
  GetPurchaseOrderAnalyticsResponse,
  GetSupplierAnalyticsResponse,
  GetWarehouseAnalyticsResponse,
  GetReplenishmentAnalyticsResponse,
  ReportDashboardParams,
  ReportHealthParams,
  SalesOrderReportParams,
  SalesSummaryParams,
  SalesTimelineParams,
  InventorySummaryParams,
  InventoryMovementParams,
  InventoryLowStockParams,
  InventoryValuationParams,
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

function appendSalesFilterParams(
  searchParams: URLSearchParams,
  params: {
    storeId: string;
    fromDate?: string;
    toDate?: string;
    timezone?: string;
    currency?: string;
    orderStatus?: string;
    warehouseIds?: readonly string[];
  },
): void {
  searchParams.set("storeId", params.storeId);
  appendQueryParam(searchParams, "fromDate", params.fromDate);
  appendQueryParam(searchParams, "toDate", params.toDate);
  appendQueryParam(searchParams, "timezone", params.timezone);
  appendQueryParam(searchParams, "currency", params.currency);
  appendQueryParam(searchParams, "orderStatus", params.orderStatus);

  for (const warehouseId of params.warehouseIds ?? []) {
    searchParams.append("warehouseIds", warehouseId);
  }
}

function toSalesSummaryQueryString(params: SalesSummaryParams): string {
  const searchParams = new URLSearchParams();
  appendSalesFilterParams(searchParams, params);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toSalesTimelineQueryString(params: SalesTimelineParams): string {
  const searchParams = new URLSearchParams();
  appendSalesFilterParams(searchParams, params);
  appendQueryParam(searchParams, "granularity", params.granularity);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toSalesOrdersQueryString(params: SalesOrderReportParams): string {
  const searchParams = new URLSearchParams();
  appendSalesFilterParams(searchParams, params);
  appendQueryParam(searchParams, "page", params.page);
  appendQueryParam(searchParams, "limit", params.limit);
  appendQueryParam(searchParams, "sortBy", params.sortBy);
  appendQueryParam(searchParams, "sortDirection", params.sortDirection);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function appendInventoryFilterParams(
  searchParams: URLSearchParams,
  params: {
    storeId: string;
    fromDate?: string;
    toDate?: string;
    timezone?: string;
    currency?: string;
    warehouseIds?: readonly string[];
    productVariantIds?: readonly string[];
    supplierIds?: readonly string[];
    movementType?: string;
  },
): void {
  searchParams.set("storeId", params.storeId);
  appendQueryParam(searchParams, "fromDate", params.fromDate);
  appendQueryParam(searchParams, "toDate", params.toDate);
  appendQueryParam(searchParams, "timezone", params.timezone);
  appendQueryParam(searchParams, "currency", params.currency);
  appendQueryParam(searchParams, "movementType", params.movementType);

  for (const warehouseId of params.warehouseIds ?? []) {
    searchParams.append("warehouseIds", warehouseId);
  }

  for (const productVariantId of params.productVariantIds ?? []) {
    searchParams.append("productVariantIds", productVariantId);
  }

  for (const supplierId of params.supplierIds ?? []) {
    searchParams.append("supplierIds", supplierId);
  }
}

function toInventorySummaryQueryString(params: InventorySummaryParams): string {
  const searchParams = new URLSearchParams();
  appendInventoryFilterParams(searchParams, params);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toInventoryMovementQueryString(
  params: InventoryMovementParams,
): string {
  const searchParams = new URLSearchParams();
  appendInventoryFilterParams(searchParams, params);
  appendQueryParam(searchParams, "page", params.page);
  appendQueryParam(searchParams, "limit", params.limit);
  appendQueryParam(searchParams, "sortBy", params.sortBy);
  appendQueryParam(searchParams, "sortDirection", params.sortDirection);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toInventoryLowStockQueryString(params: InventoryLowStockParams): string {
  const searchParams = new URLSearchParams();
  appendInventoryFilterParams(searchParams, params);
  appendQueryParam(searchParams, "page", params.page);
  appendQueryParam(searchParams, "limit", params.limit);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toInventoryValuationQueryString(
  params: InventoryValuationParams,
): string {
  const searchParams = new URLSearchParams();
  appendInventoryFilterParams(searchParams, params);
  appendQueryParam(searchParams, "page", params.page);
  appendQueryParam(searchParams, "limit", params.limit);
  appendQueryParam(searchParams, "sortBy", params.sortBy);
  appendQueryParam(searchParams, "sortDirection", params.sortDirection);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function appendCustomerFilterParams(
  searchParams: URLSearchParams,
  params: {
    storeId: string;
    fromDate?: string;
    toDate?: string;
    timezone?: string;
    currency?: string;
    orderStatus?: string;
    customerStatus?: string;
    customerIds?: readonly string[];
  },
): void {
  searchParams.set("storeId", params.storeId);
  appendQueryParam(searchParams, "fromDate", params.fromDate);
  appendQueryParam(searchParams, "toDate", params.toDate);
  appendQueryParam(searchParams, "timezone", params.timezone);
  appendQueryParam(searchParams, "currency", params.currency);
  appendQueryParam(searchParams, "orderStatus", params.orderStatus);
  appendQueryParam(searchParams, "customerStatus", params.customerStatus);

  for (const customerId of params.customerIds ?? []) {
    searchParams.append("customerIds", customerId);
  }
}

function toCustomerSummaryQueryString(params: CustomerSummaryParams): string {
  const searchParams = new URLSearchParams();
  appendCustomerFilterParams(searchParams, params);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toCustomerGrowthQueryString(params: CustomerGrowthParams): string {
  const searchParams = new URLSearchParams();
  appendCustomerFilterParams(searchParams, params);
  appendQueryParam(searchParams, "granularity", params.granularity);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toTopCustomersQueryString(params: TopCustomersParams): string {
  const searchParams = new URLSearchParams();
  appendCustomerFilterParams(searchParams, params);
  appendQueryParam(searchParams, "page", params.page);
  appendQueryParam(searchParams, "limit", params.limit);
  appendQueryParam(searchParams, "sortBy", params.sortBy);
  appendQueryParam(searchParams, "sortDirection", params.sortDirection);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toCustomerOrdersQueryString(params: CustomerOrdersParams): string {
  const searchParams = new URLSearchParams();
  appendCustomerFilterParams(searchParams, params);
  appendQueryParam(searchParams, "page", params.page);
  appendQueryParam(searchParams, "limit", params.limit);
  appendQueryParam(searchParams, "sortBy", params.sortBy);
  appendQueryParam(searchParams, "sortDirection", params.sortDirection);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function appendFinancialFilterParams(
  searchParams: URLSearchParams,
  params: {
    storeId: string;
    fromDate?: string;
    toDate?: string;
    timezone?: string;
    currency?: string;
    orderStatus?: string;
    paymentStatus?: string;
    invoiceStatus?: string;
    warehouseIds?: readonly string[];
  },
): void {
  searchParams.set("storeId", params.storeId);
  appendQueryParam(searchParams, "fromDate", params.fromDate);
  appendQueryParam(searchParams, "toDate", params.toDate);
  appendQueryParam(searchParams, "timezone", params.timezone);
  appendQueryParam(searchParams, "currency", params.currency);
  appendQueryParam(searchParams, "orderStatus", params.orderStatus);
  appendQueryParam(searchParams, "paymentStatus", params.paymentStatus);
  appendQueryParam(searchParams, "invoiceStatus", params.invoiceStatus);

  for (const warehouseId of params.warehouseIds ?? []) {
    searchParams.append("warehouseIds", warehouseId);
  }
}

function toFinancialSummaryQueryString(params: FinancialSummaryParams): string {
  const searchParams = new URLSearchParams();
  appendFinancialFilterParams(searchParams, params);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toRevenueTimelineQueryString(params: RevenueTimelineParams): string {
  const searchParams = new URLSearchParams();
  appendFinancialFilterParams(searchParams, params);
  appendQueryParam(searchParams, "granularity", params.granularity);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toPaymentReportQueryString(params: PaymentReportParams): string {
  const searchParams = new URLSearchParams();
  appendFinancialFilterParams(searchParams, params);
  appendQueryParam(searchParams, "page", params.page);
  appendQueryParam(searchParams, "limit", params.limit);
  appendQueryParam(searchParams, "sortBy", params.sortBy);
  appendQueryParam(searchParams, "sortDirection", params.sortDirection);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toInvoiceReportQueryString(params: InvoiceReportParams): string {
  const searchParams = new URLSearchParams();
  appendFinancialFilterParams(searchParams, params);
  appendQueryParam(searchParams, "page", params.page);
  appendQueryParam(searchParams, "limit", params.limit);
  appendQueryParam(searchParams, "sortBy", params.sortBy);
  appendQueryParam(searchParams, "sortDirection", params.sortDirection);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toRefundReportQueryString(params: RefundReportParams): string {
  const searchParams = new URLSearchParams();
  appendFinancialFilterParams(searchParams, params);
  appendQueryParam(searchParams, "page", params.page);
  appendQueryParam(searchParams, "limit", params.limit);
  appendQueryParam(searchParams, "sortBy", params.sortBy);
  appendQueryParam(searchParams, "sortDirection", params.sortDirection);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function appendProcurementFilterParams(
  searchParams: URLSearchParams,
  params: {
    storeId: string;
    fromDate?: string;
    toDate?: string;
    timezone?: string;
    currency?: string;
    purchaseOrderStatus?: string;
    warehouseIds?: readonly string[];
    supplierIds?: readonly string[];
  },
): void {
  searchParams.set("storeId", params.storeId);
  appendQueryParam(searchParams, "fromDate", params.fromDate);
  appendQueryParam(searchParams, "toDate", params.toDate);
  appendQueryParam(searchParams, "timezone", params.timezone);
  appendQueryParam(searchParams, "currency", params.currency);
  appendQueryParam(searchParams, "purchaseOrderStatus", params.purchaseOrderStatus);

  for (const warehouseId of params.warehouseIds ?? []) {
    searchParams.append("warehouseIds", warehouseId);
  }

  for (const supplierId of params.supplierIds ?? []) {
    searchParams.append("supplierIds", supplierId);
  }
}

function toProcurementSummaryQueryString(
  params: ProcurementSummaryParams,
): string {
  const searchParams = new URLSearchParams();
  appendProcurementFilterParams(searchParams, params);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toPurchaseOrderAnalyticsQueryString(
  params: PurchaseOrderAnalyticsParams,
): string {
  const searchParams = new URLSearchParams();
  appendProcurementFilterParams(searchParams, params);
  appendQueryParam(searchParams, "page", params.page);
  appendQueryParam(searchParams, "limit", params.limit);
  appendQueryParam(searchParams, "sortBy", params.sortBy);
  appendQueryParam(searchParams, "sortDirection", params.sortDirection);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toSupplierAnalyticsQueryString(params: SupplierAnalyticsParams): string {
  const searchParams = new URLSearchParams();
  appendProcurementFilterParams(searchParams, params);
  appendQueryParam(searchParams, "page", params.page);
  appendQueryParam(searchParams, "limit", params.limit);
  appendQueryParam(searchParams, "sortBy", params.sortBy);
  appendQueryParam(searchParams, "sortDirection", params.sortDirection);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toWarehouseAnalyticsQueryString(
  params: WarehouseAnalyticsParams,
): string {
  const searchParams = new URLSearchParams();
  appendProcurementFilterParams(searchParams, params);
  appendQueryParam(searchParams, "page", params.page);
  appendQueryParam(searchParams, "limit", params.limit);
  appendQueryParam(searchParams, "sortBy", params.sortBy);
  appendQueryParam(searchParams, "sortDirection", params.sortDirection);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toReplenishmentAnalyticsQueryString(
  params: ReplenishmentAnalyticsParams,
): string {
  const searchParams = new URLSearchParams();
  appendProcurementFilterParams(searchParams, params);
  appendQueryParam(searchParams, "page", params.page);
  appendQueryParam(searchParams, "limit", params.limit);
  appendQueryParam(searchParams, "sortBy", params.sortBy);
  appendQueryParam(searchParams, "sortDirection", params.sortDirection);
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

    getSalesSummary(
      params: SalesSummaryParams,
    ): Promise<GetSalesSummaryResponse> {
      return apiRequest(config, {
        method: "GET",
        path: `/api/reports/sales/summary${toSalesSummaryQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      });
    },

    getSalesTimeline(
      params: SalesTimelineParams,
    ): Promise<GetSalesTimelineResponse> {
      return apiRequest(config, {
        method: "GET",
        path: `/api/reports/sales/timeline${toSalesTimelineQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      });
    },

    listSalesOrders(
      params: SalesOrderReportParams,
    ): Promise<GetSalesOrdersReportResponse> {
      return apiRequest(config, {
        method: "GET",
        path: `/api/reports/sales/orders${toSalesOrdersQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      });
    },

    getInventorySummary(
      params: InventorySummaryParams,
    ): Promise<GetInventorySummaryResponse> {
      return apiRequest(config, {
        method: "GET",
        path: `/api/reports/inventory/summary${toInventorySummaryQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      });
    },

    getInventoryMovements(
      params: InventoryMovementParams,
    ): Promise<GetInventoryMovementResponse> {
      return apiRequest(config, {
        method: "GET",
        path: `/api/reports/inventory/stock-movements${toInventoryMovementQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      });
    },

    getLowStockReport(
      params: InventoryLowStockParams,
    ): Promise<GetLowStockReportResponse> {
      return apiRequest(config, {
        method: "GET",
        path: `/api/reports/inventory/low-stock${toInventoryLowStockQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      });
    },

    getInventoryValuation(
      params: InventoryValuationParams,
    ): Promise<GetInventoryValuationResponse> {
      return apiRequest(config, {
        method: "GET",
        path: `/api/reports/inventory/valuation${toInventoryValuationQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      });
    },

    getCustomerSummary(
      params: CustomerSummaryParams,
    ): Promise<GetCustomerSummaryResponse> {
      return apiRequest(config, {
        method: "GET",
        path: `/api/reports/customers/summary${toCustomerSummaryQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      });
    },

    getCustomerGrowth(
      params: CustomerGrowthParams,
    ): Promise<GetCustomerGrowthResponse> {
      return apiRequest(config, {
        method: "GET",
        path: `/api/reports/customers/growth${toCustomerGrowthQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      });
    },

    getTopCustomers(
      params: TopCustomersParams,
    ): Promise<GetTopCustomersResponse> {
      return apiRequest(config, {
        method: "GET",
        path: `/api/reports/customers/top${toTopCustomersQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      });
    },

    listCustomerOrders(
      params: CustomerOrdersParams,
    ): Promise<GetCustomerOrdersResponse> {
      return apiRequest(config, {
        method: "GET",
        path: `/api/reports/customers/orders${toCustomerOrdersQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      });
    },

    getFinancialSummary(
      params: FinancialSummaryParams,
    ): Promise<GetFinancialSummaryResponse> {
      return apiRequest(config, {
        method: "GET",
        path: `/api/reports/financial/summary${toFinancialSummaryQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      });
    },

    getRevenueTimeline(
      params: RevenueTimelineParams,
    ): Promise<GetRevenueTimelineResponse> {
      return apiRequest(config, {
        method: "GET",
        path: `/api/reports/financial/revenue${toRevenueTimelineQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      });
    },

    getPaymentReport(
      params: PaymentReportParams,
    ): Promise<GetPaymentReportResponse> {
      return apiRequest(config, {
        method: "GET",
        path: `/api/reports/financial/payments${toPaymentReportQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      });
    },

    getInvoiceReport(
      params: InvoiceReportParams,
    ): Promise<GetInvoiceReportResponse> {
      return apiRequest(config, {
        method: "GET",
        path: `/api/reports/financial/invoices${toInvoiceReportQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      });
    },

    getRefundReport(
      params: RefundReportParams,
    ): Promise<GetRefundReportResponse> {
      return apiRequest(config, {
        method: "GET",
        path: `/api/reports/financial/refunds${toRefundReportQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      });
    },

    getProcurementSummary(
      params: ProcurementSummaryParams,
    ): Promise<GetProcurementSummaryResponse> {
      return apiRequest(config, {
        method: "GET",
        path: `/api/reports/procurement/summary${toProcurementSummaryQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      });
    },

    getPurchaseOrderAnalytics(
      params: PurchaseOrderAnalyticsParams,
    ): Promise<GetPurchaseOrderAnalyticsResponse> {
      return apiRequest(config, {
        method: "GET",
        path: `/api/reports/procurement/purchase-orders${toPurchaseOrderAnalyticsQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      });
    },

    getSupplierAnalytics(
      params: SupplierAnalyticsParams,
    ): Promise<GetSupplierAnalyticsResponse> {
      return apiRequest(config, {
        method: "GET",
        path: `/api/reports/procurement/suppliers${toSupplierAnalyticsQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      });
    },

    getWarehouseAnalytics(
      params: WarehouseAnalyticsParams,
    ): Promise<GetWarehouseAnalyticsResponse> {
      return apiRequest(config, {
        method: "GET",
        path: `/api/reports/procurement/warehouses${toWarehouseAnalyticsQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      });
    },

    getReplenishmentAnalytics(
      params: ReplenishmentAnalyticsParams,
    ): Promise<GetReplenishmentAnalyticsResponse> {
      return apiRequest(config, {
        method: "GET",
        path: `/api/reports/procurement/replenishment${toReplenishmentAnalyticsQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      });
    },
  };
}

export type ReportsClient = ReturnType<typeof createReportsClient>;
