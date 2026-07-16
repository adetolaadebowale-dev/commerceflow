import { describe, expect, it } from "vitest";

import {
  inventoryLowStockQuerySchema,
  inventoryMovementQuerySchema,
  inventorySummaryQuerySchema,
  inventoryValuationQuerySchema,
} from "./inventory.schemas";

const STORE_ID = "11111111-1111-1111-1111-111111111111";
const WAREHOUSE_ID = "33333333-3333-3333-3333-333333333333";
const VARIANT_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const SUPPLIER_ID = "dddddddd-dddd-dddd-dddd-dddddddddddd";

describe("inventory report query schemas", () => {
  it("validates inventory summary query filters", () => {
    const parsed = inventorySummaryQuerySchema.safeParse({
      storeId: STORE_ID,
      warehouseIds: [WAREHOUSE_ID],
      productVariantIds: [VARIANT_ID],
      supplierIds: [SUPPLIER_ID],
      fromDate: "2026-07-01T00:00:00.000Z",
      toDate: "2026-07-31T23:59:59.000Z",
    });

    expect(parsed.success).toBe(true);
  });

  it("validates stock movement query with movement type and pagination", () => {
    const parsed = inventoryMovementQuerySchema.safeParse({
      storeId: STORE_ID,
      movementType: "adjustment",
      page: 2,
      limit: 50,
      sortBy: "generatedAt",
      sortDirection: "asc",
    });

    expect(parsed.success).toBe(true);
  });

  it("validates low stock and valuation queries", () => {
    expect(
      inventoryLowStockQuerySchema.safeParse({
        storeId: STORE_ID,
        page: 1,
        limit: 20,
      }).success,
    ).toBe(true);

    expect(
      inventoryValuationQuerySchema.safeParse({
        storeId: STORE_ID,
        page: 1,
        limit: 20,
        sortBy: "generatedAt",
        sortDirection: "desc",
      }).success,
    ).toBe(true);
  });

  it("rejects invalid date ranges", () => {
    const parsed = inventorySummaryQuerySchema.safeParse({
      storeId: STORE_ID,
      fromDate: "2026-08-01T00:00:00.000Z",
      toDate: "2026-07-01T00:00:00.000Z",
    });

    expect(parsed.success).toBe(false);
  });
});
