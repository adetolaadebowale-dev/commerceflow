"use client";

import { useQuery } from "@tanstack/react-query";

import { inventoryMovementsQueryKey } from "@/features/reports/report-query-keys";
import {
  getInventoryMovementsReport,
  type ReportDateFilter,
} from "@/services/reports.service";

export function useInventoryMovements(filters: ReportDateFilter | null) {
  return useQuery({
    queryKey: inventoryMovementsQueryKey(filters ?? { storeId: "" }),
    enabled: Boolean(filters?.storeId),
    queryFn: () => {
      if (!filters) {
        throw new Error("Report filters are required");
      }
      return getInventoryMovementsReport({ ...filters, limit: 10 });
    },
  });
}
