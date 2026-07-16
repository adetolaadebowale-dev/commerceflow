import { describe, expect, it } from "vitest";

import {
  aggregateCount,
  aggregateNumericSum,
  assertStoreScope,
  buildReportDateRange,
  buildReportFilter,
  filterByWarehouseIds,
  groupItems,
  isWithinDateRange,
  paginateItems,
  parseCurrencyAmount,
  resolveTimezoneAwareBounds,
  resolveWarehouseScope,
  sortItems,
  sumCurrencyAmounts,
} from "../services/report-utils";

describe("report-utils", () => {
  it("builds date ranges and resolves timezone-aware bounds", () => {
    const dateRange = buildReportDateRange(
      {
        fromDate: "2026-07-01T00:00:00.000Z",
        toDate: "2026-07-31T23:59:59.000Z",
        timezone: "America/New_York",
      },
      { defaultTimezone: "UTC" },
    );

    expect(dateRange).toEqual({
      from: "2026-07-01T00:00:00.000Z",
      to: "2026-07-31T23:59:59.000Z",
      timezone: "America/New_York",
    });

    const bounds = resolveTimezoneAwareBounds(dateRange!);
    expect(bounds.timezone).toBe("America/New_York");
    expect(isWithinDateRange("2026-07-15T12:00:00.000Z", dateRange!)).toBe(true);
    expect(isWithinDateRange("2026-08-01T00:00:00.000Z", dateRange!)).toBe(false);
  });

  it("paginates, sorts, and groups report rows", () => {
    const rows = [
      { storeId: "a", warehouseId: "wh-1", amount: 3, generatedAt: "2026-07-03" },
      { storeId: "a", warehouseId: "wh-2", amount: 1, generatedAt: "2026-07-01" },
      { storeId: "a", warehouseId: "wh-1", amount: 2, generatedAt: "2026-07-02" },
    ];

    const sorted = sortItems(rows, "amount", "desc");
    expect(sorted[0]?.amount).toBe(3);

    const grouped = groupItems(rows, "warehouseId");
    expect(grouped.get("wh-1")).toHaveLength(2);
    expect(aggregateCount(rows)).toBe(3);
    expect(aggregateNumericSum(rows, "amount")).toBe(6);

    const paginated = paginateItems(sorted, 1, 2);
    expect(paginated.items).toHaveLength(2);
    expect(paginated.pagination.totalPages).toBe(2);
  });

  it("filters by warehouse scope and enforces store scoping", () => {
    const scoped = resolveWarehouseScope(
      ["wh-1", "wh-3"],
      ["wh-1", "wh-2"],
    );
    expect(scoped).toEqual(["wh-1"]);

    const filtered = filterByWarehouseIds(
      [
        { storeId: "a", warehouseId: "wh-1" },
        { storeId: "a", warehouseId: "wh-2" },
      ],
      ["wh-2"],
    );
    expect(filtered).toHaveLength(1);

    expect(() =>
      assertStoreScope(
        [{ storeId: "a" }, { storeId: "b" }],
        "a",
      ),
    ).toThrow();
  });

  it("builds report filters with warehouse and currency defaults", () => {
    const filter = buildReportFilter(
      {
        storeId: "11111111-1111-1111-1111-111111111111",
        fromDate: "2026-07-01T00:00:00.000Z",
        toDate: "2026-07-02T00:00:00.000Z",
      },
      {
        defaultTimezone: "UTC",
        defaultCurrency: "USD",
        activeWarehouseIds: ["wh-1"],
      },
    );

    expect(filter.currency).toBe("USD");
    expect(filter.warehouseIds).toEqual(["wh-1"]);
    expect(filter.dateRange?.timezone).toBe("UTC");
  });

  it("sums currency amounts safely", () => {
    expect(sumCurrencyAmounts(["10.00", "2.50", "0.05"])).toBe("12.55");
    expect(parseCurrencyAmount("-1.25")).toBe(-125n);
  });
});
