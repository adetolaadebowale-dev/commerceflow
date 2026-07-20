"use client";

import { useQuery } from "@tanstack/react-query";

import { REPORT_QUERY_STALE_TIME_MS } from "@/features/reports/report-query-options";
import { inventoryMovementsQueryKey } from "@/features/reports/report-query-keys";
import {
  getInventoryMovementsReport,
  type ReportDateFilter,
} from "@/services/reports.service";

export function useInventoryMovements(filters: ReportDateFilter | null) {
  return useQuery({
    queryKey: inventoryMovementsQueryKey(filters ?? { storeId: "" }),
    enabled: Boolean(filters?.storeId),
    staleTime: REPORT_QUERY_STALE_TIME_MS,
    queryFn: () => {
      if (!filters) {
        throw new Error("Report filters are required");
      }
      return getInventoryMovementsReport({ ...filters, limit: 10 });
    },
  });
}
