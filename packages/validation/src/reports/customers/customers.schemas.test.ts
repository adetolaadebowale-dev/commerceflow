import { describe, expect, it } from "vitest";

import {
  customerGrowthQuerySchema,
  customerOrdersQuerySchema,
  customerSummaryQuerySchema,
  topCustomersQuerySchema,
} from "./customers.schemas";

const STORE_ID = "11111111-1111-1111-1111-111111111111";
const CUSTOMER_ID = "55555555-5555-5555-5555-555555555555";

describe("customer report query schemas", () => {
  it("validates customer summary query filters", () => {
    const parsed = customerSummaryQuerySchema.safeParse({
      storeId: STORE_ID,
      customerIds: [CUSTOMER_ID],
      customerStatus: "active",
      fromDate: "2026-07-01T00:00:00.000Z",
      toDate: "2026-07-31T23:59:59.000Z",
      orderStatus: "confirmed",
    });

    expect(parsed.success).toBe(true);
  });

  it("validates customer growth query with granularity", () => {
    const parsed = customerGrowthQuerySchema.safeParse({
      storeId: STORE_ID,
      granularity: "week",
      fromDate: "2026-07-01T00:00:00.000Z",
      toDate: "2026-07-31T23:59:59.000Z",
    });

    expect(parsed.success).toBe(true);
  });

  it("validates top customers and order history queries", () => {
    expect(
      topCustomersQuerySchema.safeParse({
        storeId: STORE_ID,
        page: 1,
        limit: 20,
        sortBy: "lifetimeValue",
        sortDirection: "desc",
      }).success,
    ).toBe(true);

    expect(
      customerOrdersQuerySchema.safeParse({
        storeId: STORE_ID,
        customerIds: [CUSTOMER_ID],
        page: 2,
        limit: 50,
        sortBy: "generatedAt",
        sortDirection: "asc",
      }).success,
    ).toBe(true);
  });

  it("rejects invalid date ranges", () => {
    const parsed = customerSummaryQuerySchema.safeParse({
      storeId: STORE_ID,
      fromDate: "2026-08-01T00:00:00.000Z",
      toDate: "2026-07-01T00:00:00.000Z",
    });

    expect(parsed.success).toBe(false);
  });
});
