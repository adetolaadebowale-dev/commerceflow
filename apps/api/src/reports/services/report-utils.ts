import type {
  ReportDateRange,
  ReportFilter,
  ReportPagination,
} from "@commerceflow/types";

export const REPORT_FOUNDATION_VERSION = "1.0.0";

export const DEFAULT_REPORT_TIMEZONE = "UTC";

export const DEFAULT_REPORT_CURRENCY = "USD";

export const REPORT_FOUNDATION_FEATURES = [
  "date_range_filtering",
  "pagination",
  "grouping",
  "aggregation",
  "store_scoping",
  "warehouse_scoping",
  "timezone_aware_reporting",
  "currency_safe_totals",
] as const;

export interface ReportQueryOptions {
  readonly storeId: string;
  readonly warehouseIds?: readonly string[];
  readonly fromDate?: string;
  readonly toDate?: string;
  readonly timezone?: string;
  readonly currency?: string;
  readonly page?: number;
  readonly limit?: number;
  readonly sortBy?: string;
  readonly sortDirection?: "asc" | "desc";
  readonly groupBy?: string;
}

export interface StoreReportingDefaults {
  readonly defaultTimezone: string;
  readonly defaultCurrency: string;
  readonly activeWarehouseIds: readonly string[];
}

export function buildReportDateRange(
  options: Pick<
    ReportQueryOptions,
    "fromDate" | "toDate" | "timezone"
  >,
  defaults: Pick<StoreReportingDefaults, "defaultTimezone">,
): ReportDateRange | undefined {
  if (!options.fromDate || !options.toDate) {
    return undefined;
  }

  return {
    from: options.fromDate,
    to: options.toDate,
    timezone: options.timezone ?? defaults.defaultTimezone,
  };
}

export function resolveTimezoneAwareBounds(dateRange: ReportDateRange): {
  readonly fromUtc: string;
  readonly toUtc: string;
  readonly timezone: string;
} {
  const fromUtc = new Date(dateRange.from).toISOString();
  const toUtc = new Date(dateRange.to).toISOString();

  if (fromUtc.localeCompare(toUtc) > 0) {
    throw new Error("Invalid date range: from is after to");
  }

  return {
    fromUtc,
    toUtc,
    timezone: dateRange.timezone,
  };
}

export function buildReportFilter(
  options: ReportQueryOptions,
  defaults: StoreReportingDefaults,
): ReportFilter {
  return {
    storeId: options.storeId,
    warehouseIds: resolveWarehouseScope(
      options.warehouseIds,
      defaults.activeWarehouseIds,
    ),
    dateRange: buildReportDateRange(options, defaults),
    currency: options.currency ?? defaults.defaultCurrency,
  };
}

export function resolveWarehouseScope(
  requestedWarehouseIds: readonly string[] | undefined,
  activeWarehouseIds: readonly string[],
): readonly string[] | undefined {
  if (!requestedWarehouseIds || requestedWarehouseIds.length === 0) {
    return activeWarehouseIds.length > 0 ? activeWarehouseIds : undefined;
  }

  const activeSet = new Set(activeWarehouseIds);
  return requestedWarehouseIds.filter((warehouseId) =>
    activeSet.size === 0 ? true : activeSet.has(warehouseId),
  );
}

export function filterByWarehouseIds<T extends { readonly warehouseId?: string }>(
  items: readonly T[],
  warehouseIds: readonly string[] | undefined,
): readonly T[] {
  if (!warehouseIds || warehouseIds.length === 0) {
    return items;
  }

  const allowed = new Set(warehouseIds);

  return items.filter(
    (item) => item.warehouseId === undefined || allowed.has(item.warehouseId),
  );
}

export function assertStoreScope<T extends { readonly storeId: string }>(
  items: readonly T[],
  storeId: string,
): void {
  const invalid = items.find((item) => item.storeId !== storeId);

  if (invalid) {
    throw new Error("Report query returned data outside the requested store scope");
  }
}

export function paginateItems<T>(
  items: readonly T[],
  page: number,
  limit: number,
): { readonly items: readonly T[]; readonly pagination: ReportPagination } {
  const totalItems = items.length;
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
  const normalizedPage = totalPages === 0 ? 1 : Math.min(page, totalPages);
  const offset = (normalizedPage - 1) * limit;

  return {
    items: items.slice(offset, offset + limit),
    pagination: {
      page: normalizedPage,
      limit,
      totalItems,
      totalPages,
    },
  };
}

export function sortItems<T extends Record<string, unknown>>(
  items: readonly T[],
  sortBy: string,
  sortDirection: "asc" | "desc",
): readonly T[] {
  const direction = sortDirection === "asc" ? 1 : -1;

  return [...items].sort((left, right) => {
    const leftValue = left[sortBy];
    const rightValue = right[sortBy];

    if (leftValue === rightValue) {
      return 0;
    }

    if (leftValue === undefined) {
      return 1;
    }

    if (rightValue === undefined) {
      return -1;
    }

    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return leftValue < rightValue ? -direction : direction;
    }

    return String(leftValue).localeCompare(String(rightValue)) * direction;
  });
}

export function groupItems<T extends Record<string, unknown>>(
  items: readonly T[],
  groupBy: string,
): ReadonlyMap<string, readonly T[]> {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const key = String(item[groupBy] ?? "unknown");
    const existing = groups.get(key) ?? [];
    groups.set(key, [...existing, item]);
  }

  return groups;
}

export function aggregateCount<T>(items: readonly T[]): number {
  return items.length;
}

export function aggregateNumericSum(
  items: readonly Record<string, unknown>[],
  field: string,
): number {
  return items.reduce((total, item) => {
    const value = item[field];
    return total + (typeof value === "number" ? value : 0);
  }, 0);
}

export function parseCurrencyAmount(value: string): bigint {
  const normalized = value.trim();

  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error(`Invalid currency amount: ${value}`);
  }

  const negative = normalized.startsWith("-");
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [wholePart, fractionPart = ""] = unsigned.split(".");
  const cents = BigInt(wholePart) * 100n + BigInt((fractionPart + "00").slice(0, 2));

  return negative ? -cents : cents;
}

export function formatCurrencyAmount(cents: bigint): string {
  const negative = cents < 0n;
  const absolute = negative ? -cents : cents;
  const whole = absolute / 100n;
  const fraction = absolute % 100n;
  const formatted = `${whole.toString()}.${fraction.toString().padStart(2, "0")}`;

  return negative ? `-${formatted}` : formatted;
}

export function sumCurrencyAmounts(values: readonly string[]): string {
  const total = values.reduce(
    (accumulator, value) => accumulator + parseCurrencyAmount(value),
    0n,
  );

  return formatCurrencyAmount(total);
}

export function isWithinDateRange(
  timestamp: string,
  dateRange: ReportDateRange,
): boolean {
  const bounds = resolveTimezoneAwareBounds(dateRange);
  return (
    timestamp.localeCompare(bounds.fromUtc) >= 0 &&
    timestamp.localeCompare(bounds.toUtc) <= 0
  );
}
