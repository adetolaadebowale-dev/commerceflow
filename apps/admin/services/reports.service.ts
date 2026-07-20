import type {
  CustomerSummary,
  ExecutiveDashboard,
  InventoryMovementReport,
  LowStockReport,
  SalesOrdersReport,
  SalesSummary,
} from "@commerceflow/types";

import { reportsClient, toAdminApiError } from "@/services/inventory-client";

export interface ReportDateFilter {
  readonly storeId: string;
  readonly fromDate?: string;
  readonly toDate?: string;
}

function unwrapReportData<T>(result: T | { data: T }): T {
  if (result && typeof result === "object" && "data" in result) {
    return (result as { data: T }).data;
  }
  return result as T;
}

export async function getExecutiveDashboard(
  params: ReportDateFilter,
): Promise<ExecutiveDashboard> {
  try {
    const result = await reportsClient.getExecutiveDashboard({
      storeId: params.storeId,
      fromDate: params.fromDate,
      toDate: params.toDate,
    });
    return unwrapReportData(result as ExecutiveDashboard | { data: ExecutiveDashboard });
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function getSalesSummary(
  params: ReportDateFilter,
): Promise<SalesSummary> {
  try {
    const result = await reportsClient.getSalesSummary({
      storeId: params.storeId,
      fromDate: params.fromDate,
      toDate: params.toDate,
    });
    return unwrapReportData(result as SalesSummary | { data: SalesSummary });
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function getCustomerSummary(
  params: ReportDateFilter,
): Promise<CustomerSummary> {
  try {
    const result = await reportsClient.getCustomerSummary({
      storeId: params.storeId,
      fromDate: params.fromDate,
      toDate: params.toDate,
    });
    return unwrapReportData(
      result as CustomerSummary | { data: CustomerSummary },
    );
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function getLowStockReport(
  params: ReportDateFilter & { readonly limit?: number },
): Promise<LowStockReport> {
  try {
    const result = await reportsClient.getLowStockReport({
      storeId: params.storeId,
      fromDate: params.fromDate,
      toDate: params.toDate,
      page: 1,
      limit: params.limit ?? 20,
    });
    return unwrapReportData(result as LowStockReport | { data: LowStockReport });
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function getSalesOrdersReport(
  params: ReportDateFilter & { readonly limit?: number },
): Promise<SalesOrdersReport> {
  try {
    const result = await reportsClient.listSalesOrders({
      storeId: params.storeId,
      fromDate: params.fromDate,
      toDate: params.toDate,
      page: 1,
      limit: params.limit ?? 10,
      sortBy: "generatedAt",
      sortDirection: "desc",
    });
    return unwrapReportData(
      result as SalesOrdersReport | { data: SalesOrdersReport },
    );
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function getInventoryMovementsReport(
  params: ReportDateFilter & { readonly limit?: number },
): Promise<InventoryMovementReport> {
  try {
    const result = await reportsClient.getInventoryMovements({
      storeId: params.storeId,
      fromDate: params.fromDate,
      toDate: params.toDate,
      page: 1,
      limit: params.limit ?? 10,
      sortBy: "generatedAt",
      sortDirection: "desc",
    });
    return unwrapReportData(
      result as InventoryMovementReport | { data: InventoryMovementReport },
    );
  } catch (error) {
    throw toAdminApiError(error);
  }
}
