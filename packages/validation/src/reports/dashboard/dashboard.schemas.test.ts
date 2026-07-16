import { describe, expect, it } from "vitest";

import {
  dashboardKPIQuerySchema,
  executiveDashboardQuerySchema,
} from "./dashboard.schemas";

const STORE_ID = "11111111-1111-1111-1111-111111111111";
const WAREHOUSE_ID = "33333333-3333-3333-3333-333333333333";

describe("dashboard report query schemas", () => {
  it("validates executive dashboard query filters", () => {
    const parsed = executiveDashboardQuerySchema.safeParse({
      storeId: STORE_ID,
      fromDate: "2026-07-01T00:00:00.000Z",
      toDate: "2026-07-31T23:59:59.000Z",
      currency: "USD",
      warehouseIds: [WAREHOUSE_ID],
    });

    expect(parsed.success).toBe(true);
  });

  it("validates dashboard KPI query with pagination", () => {
    const parsed = dashboardKPIQuerySchema.safeParse({
      storeId: STORE_ID,
      page: 1,
      limit: 20,
      fromDate: "2026-07-01T00:00:00.000Z",
      toDate: "2026-07-31T23:59:59.000Z",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid date order", () => {
    const parsed = executiveDashboardQuerySchema.safeParse({
      storeId: STORE_ID,
      fromDate: "2026-08-01T00:00:00.000Z",
      toDate: "2026-07-01T00:00:00.000Z",
    });

    expect(parsed.success).toBe(false);
  });
});
