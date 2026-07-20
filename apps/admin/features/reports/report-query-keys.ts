import type { ReportDateFilter } from "@/services/reports.service";

export type ReportDatePreset = "7d" | "30d" | "90d" | "all";

export function reportsFilterKey(filters: ReportDateFilter) {
  return [
    filters.storeId,
    filters.fromDate ?? "",
    filters.toDate ?? "",
  ] as const;
}

export function executiveDashboardQueryKey(filters: ReportDateFilter) {
  return ["reports", "executive", ...reportsFilterKey(filters)] as const;
}

export function salesSummaryQueryKey(filters: ReportDateFilter) {
  return ["reports", "sales-summary", ...reportsFilterKey(filters)] as const;
}

export function customerSummaryQueryKey(filters: ReportDateFilter) {
  return ["reports", "customer-summary", ...reportsFilterKey(filters)] as const;
}

export function lowStockReportQueryKey(filters: ReportDateFilter) {
  return ["reports", "low-stock", ...reportsFilterKey(filters)] as const;
}

export function salesOrdersReportQueryKey(filters: ReportDateFilter) {
  return ["reports", "sales-orders", ...reportsFilterKey(filters)] as const;
}

export function inventoryMovementsQueryKey(filters: ReportDateFilter) {
  return ["reports", "stock-movements", ...reportsFilterKey(filters)] as const;
}

export function toReportDateRange(preset: ReportDatePreset): {
  readonly fromDate?: string;
  readonly toDate?: string;
} {
  if (preset === "all") {
    return {};
  }

  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  const toDate = new Date();
  const fromDate = new Date(toDate);
  fromDate.setUTCDate(fromDate.getUTCDate() - days);

  return {
    fromDate: fromDate.toISOString(),
    toDate: toDate.toISOString(),
  };
}
