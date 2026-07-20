"use client";

import { useQuery } from "@tanstack/react-query";

import { salesOrdersReportQueryKey } from "@/features/reports/report-query-keys";
import {
  getSalesOrdersReport,
  type ReportDateFilter,
} from "@/services/reports.service";

export function useSalesOrdersReport(filters: ReportDateFilter | null) {
  return useQuery({
    queryKey: salesOrdersReportQueryKey(filters ?? { storeId: "" }),
    enabled: Boolean(filters?.storeId),
    queryFn: () => {
      if (!filters) {
        throw new Error("Report filters are required");
      }
      return getSalesOrdersReport({ ...filters, limit: 10 });
    },
  });
}
