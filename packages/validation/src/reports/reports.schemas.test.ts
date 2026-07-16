import { describe, expect, it } from "vitest";

import {
  reportDashboardQuerySchema,
  reportDateRangeSchema,
  reportFilterSchema,
  reportPaginationSchema,
  reportSortSchema,
  reportWarehouseFilterSchema,
} from "./reports.schemas";

const TEST_STORE_ID = "11111111-1111-1111-1111-111111111111";
const TEST_WAREHOUSE_ID = "22222222-2222-2222-2222-222222222222";

describe("reports schemas", () => {
  it("validates report date range", () => {
    const parsed = reportDateRangeSchema.safeParse({
      from: "2026-07-01T00:00:00.000Z",
      to: "2026-07-31T23:59:59.000Z",
      timezone: "UTC",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects inverted report date range", () => {
    const parsed = reportDateRangeSchema.safeParse({
      from: "2026-07-31T23:59:59.000Z",
      to: "2026-07-01T00:00:00.000Z",
      timezone: "UTC",
    });

    expect(parsed.success).toBe(false);
  });

  it("validates pagination and sorting", () => {
    const pagination = reportPaginationSchema.safeParse({ page: 2, limit: 50 });
    const sorting = reportSortSchema.safeParse({
      sortBy: "generatedAt",
      sortDirection: "asc",
    });

    expect(pagination.success).toBe(true);
    expect(sorting.success).toBe(true);
  });

  it("validates warehouse filters and dashboard query", () => {
    const warehouses = reportWarehouseFilterSchema.safeParse({
      warehouseIds: [TEST_WAREHOUSE_ID],
    });
    const dashboard = reportDashboardQuerySchema.safeParse({
      storeId: TEST_STORE_ID,
      warehouseIds: [TEST_WAREHOUSE_ID],
      page: 1,
      limit: 20,
      sortBy: "generatedAt",
      sortDirection: "desc",
      groupBy: "warehouseId",
    });
    const filter = reportFilterSchema.safeParse({
      storeId: TEST_STORE_ID,
      currency: "USD",
      timezone: "UTC",
    });

    expect(warehouses.success).toBe(true);
    expect(dashboard.success).toBe(true);
    expect(filter.success).toBe(true);
  });
});
