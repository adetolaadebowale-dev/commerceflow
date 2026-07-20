"use client";

import { useQuery } from "@tanstack/react-query";

import { customerSummaryQueryKey } from "@/features/reports/report-query-keys";
import {
  getCustomerSummary,
  type ReportDateFilter,
} from "@/services/reports.service";

export function useCustomerSummary(filters: ReportDateFilter | null) {
  return useQuery({
    queryKey: customerSummaryQueryKey(filters ?? { storeId: "" }),
    enabled: Boolean(filters?.storeId),
    queryFn: () => {
      if (!filters) {
        throw new Error("Report filters are required");
      }
      return getCustomerSummary(filters);
    },
  });
}
