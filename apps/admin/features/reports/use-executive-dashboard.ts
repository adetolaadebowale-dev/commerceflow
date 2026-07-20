"use client";

import { useQuery } from "@tanstack/react-query";

import { executiveDashboardQueryKey } from "@/features/reports/report-query-keys";
import {
  getExecutiveDashboard,
  type ReportDateFilter,
} from "@/services/reports.service";

export function useExecutiveDashboard(filters: ReportDateFilter | null) {
  return useQuery({
    queryKey: executiveDashboardQueryKey(
      filters ?? { storeId: "" },
    ),
    enabled: Boolean(filters?.storeId),
    queryFn: () => {
      if (!filters) {
        throw new Error("Report filters are required");
      }
      return getExecutiveDashboard(filters);
    },
  });
}
