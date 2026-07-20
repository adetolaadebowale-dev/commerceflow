"use client";

import { useMemo, useState } from "react";

import {
  type ReportDatePreset,
  toReportDateRange,
} from "@/features/reports/report-query-keys";
import type { ReportDateFilter } from "@/services/reports.service";

export interface ReportFiltersState {
  readonly preset: ReportDatePreset;
  readonly fromDate: string;
  readonly toDate: string;
}

const DEFAULT_PRESET: ReportDatePreset = "30d";

export function useReportFilters(storeId: string | null) {
  const [preset, setPreset] = useState<ReportDatePreset>(DEFAULT_PRESET);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const filters: ReportDateFilter | null = useMemo(() => {
    if (!storeId) {
      return null;
    }

    if (preset === "all") {
      return { storeId };
    }

    // Custom range when both dates provided and preset is still a rolling window —
    // custom overrides via dedicated setters below.
    if (customFrom && customTo) {
      return {
        storeId,
        fromDate: new Date(`${customFrom}T00:00:00.000Z`).toISOString(),
        toDate: new Date(`${customTo}T23:59:59.999Z`).toISOString(),
      };
    }

    const range = toReportDateRange(preset);
    return {
      storeId,
      ...range,
    };
  }, [storeId, preset, customFrom, customTo]);

  return {
    preset,
    customFrom,
    customTo,
    filters,
    setPreset: (next: ReportDatePreset) => {
      setCustomFrom("");
      setCustomTo("");
      setPreset(next);
    },
    setCustomRange: (from: string, to: string) => {
      setCustomFrom(from);
      setCustomTo(to);
      // Keep a rolling preset label only when custom is cleared; otherwise treat as custom.
      if (from && to) {
        setPreset("30d");
      }
    },
    clearCustomRange: () => {
      setCustomFrom("");
      setCustomTo("");
    },
    hasCustomRange: Boolean(customFrom && customTo),
  };
}
