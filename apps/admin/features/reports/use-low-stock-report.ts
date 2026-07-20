"use client";

import { useQuery } from "@tanstack/react-query";

import { REPORT_QUERY_STALE_TIME_MS } from "@/features/reports/report-query-options";
import { lowStockReportQueryKey } from "@/features/reports/report-query-keys";
import {
  getLowStockReport,
  type ReportDateFilter,
} from "@/services/reports.service";

export function useLowStockReport(filters: ReportDateFilter | null) {
  return useQuery({
    queryKey: lowStockReportQueryKey(filters ?? { storeId: "" }),
    enabled: Boolean(filters?.storeId),
    staleTime: REPORT_QUERY_STALE_TIME_MS,
    queryFn: () => {
      if (!filters) {
        throw new Error("Report filters are required");
      }
      return getLowStockReport({ ...filters, limit: 20 });
    },
  });
}
