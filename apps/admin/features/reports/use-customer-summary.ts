"use client";

import { useQuery } from "@tanstack/react-query";

import { REPORT_QUERY_STALE_TIME_MS } from "@/features/reports/report-query-options";
import { customerSummaryQueryKey } from "@/features/reports/report-query-keys";
import {
  getCustomerSummary,
  type ReportDateFilter,
} from "@/services/reports.service";

export function useCustomerSummary(filters: ReportDateFilter | null) {
  return useQuery({
    queryKey: customerSummaryQueryKey(filters ?? { storeId: "" }),
    enabled: Boolean(filters?.storeId),
    staleTime: REPORT_QUERY_STALE_TIME_MS,
    queryFn: () => {
      if (!filters) {
        throw new Error("Report filters are required");
      }
      return getCustomerSummary(filters);
    },
  });
}
