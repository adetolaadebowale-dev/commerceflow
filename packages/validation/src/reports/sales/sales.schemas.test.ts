import { describe, expect, it } from "vitest";

import {
  salesOrderReportQuerySchema,
  salesSummaryQuerySchema,
  salesTimelineQuerySchema,
} from "./sales.schemas";

const STORE_ID = "11111111-1111-1111-1111-111111111111";
const WAREHOUSE_ID = "33333333-3333-3333-3333-333333333333";

describe("sales report query schemas", () => {
  it("validates sales summary query filters", () => {
    const parsed = salesSummaryQuerySchema.safeParse({
      storeId: STORE_ID,
      fromDate: "2026-07-01T00:00:00.000Z",
      toDate: "2026-07-31T23:59:59.000Z",
      timezone: "America/New_York",
      currency: "USD",
      orderStatus: "confirmed",
      warehouseIds: [WAREHOUSE_ID],
    });

    expect(parsed.success).toBe(true);
  });

  it("validates sales timeline query with granularity", () => {
    const parsed = salesTimelineQuerySchema.safeParse({
      storeId: STORE_ID,
      granularity: "week",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.granularity).toBe("week");
    }
  });

  it("validates sales orders query with pagination", () => {
    const parsed = salesOrderReportQuerySchema.safeParse({
      storeId: STORE_ID,
      page: 2,
      limit: 50,
      sortBy: "generatedAt",
      sortDirection: "asc",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.page).toBe(2);
      expect(parsed.data.limit).toBe(50);
    }
  });

  it("rejects invalid date ranges", () => {
    const parsed = salesSummaryQuerySchema.safeParse({
      storeId: STORE_ID,
      fromDate: "2026-08-01T00:00:00.000Z",
      toDate: "2026-07-01T00:00:00.000Z",
    });

    expect(parsed.success).toBe(false);
  });
});
