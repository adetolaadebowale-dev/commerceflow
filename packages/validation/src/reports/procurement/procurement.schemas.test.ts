import { describe, expect, it } from "vitest";

import {
  procurementSummaryQuerySchema,
  purchaseOrderAnalyticsQuerySchema,
  replenishmentAnalyticsQuerySchema,
  supplierAnalyticsQuerySchema,
  warehouseAnalyticsQuerySchema,
} from "./procurement.schemas";

const STORE_ID = "11111111-1111-1111-1111-111111111111";
const SUPPLIER_ID = "dddddddd-dddd-dddd-dddd-dddddddddddd";
const WAREHOUSE_ID = "33333333-3333-3333-3333-333333333333";

describe("procurement report query schemas", () => {
  it("validates procurement summary query filters", () => {
    const parsed = procurementSummaryQuerySchema.safeParse({
      storeId: STORE_ID,
      fromDate: "2026-07-01T00:00:00.000Z",
      toDate: "2026-07-31T23:59:59.000Z",
      currency: "USD",
      purchaseOrderStatus: "ordered",
      supplierIds: [SUPPLIER_ID],
      warehouseIds: [WAREHOUSE_ID],
    });

    expect(parsed.success).toBe(true);
  });

  it("validates paginated procurement report queries", () => {
    expect(
      purchaseOrderAnalyticsQuerySchema.safeParse({
        storeId: STORE_ID,
        page: 1,
        limit: 20,
        sortBy: "reportTimestamp",
        sortDirection: "desc",
        purchaseOrderStatus: "received",
      }).success,
    ).toBe(true);

    expect(
      supplierAnalyticsQuerySchema.safeParse({
        storeId: STORE_ID,
        page: 1,
        limit: 20,
        supplierIds: [SUPPLIER_ID],
      }).success,
    ).toBe(true);

    expect(
      warehouseAnalyticsQuerySchema.safeParse({
        storeId: STORE_ID,
        page: 1,
        limit: 20,
        warehouseIds: [WAREHOUSE_ID],
      }).success,
    ).toBe(true);

    expect(
      replenishmentAnalyticsQuerySchema.safeParse({
        storeId: STORE_ID,
        page: 1,
        limit: 20,
      }).success,
    ).toBe(true);
  });

  it("rejects invalid date order", () => {
    const parsed = procurementSummaryQuerySchema.safeParse({
      storeId: STORE_ID,
      fromDate: "2026-08-01T00:00:00.000Z",
      toDate: "2026-07-01T00:00:00.000Z",
    });

    expect(parsed.success).toBe(false);
  });
});
