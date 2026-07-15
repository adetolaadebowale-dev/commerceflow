import { describe, expect, it } from "vitest";

import { createPurchaseOrderSchema } from "./purchase-order.schemas";

const STORE_ID = "11111111-1111-1111-1111-111111111111";
const WAREHOUSE_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const SUPPLIER_ID = "dddddddd-dddd-dddd-dddd-dddddddddddd";
const VARIANT_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

describe("createPurchaseOrderSchema", () => {
  it("accepts a valid purchase order request", () => {
    const parsed = createPurchaseOrderSchema.safeParse({
      storeId: STORE_ID,
      warehouseId: WAREHOUSE_ID,
      supplierId: SUPPLIER_ID,
      items: [
        {
          productVariantId: VARIANT_ID,
          quantityOrdered: 5,
          unitCost: "10.00",
          currency: "usd",
        },
      ],
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.items[0]?.currency).toBe("USD");
    }
  });

  it("requires at least one line item", () => {
    const parsed = createPurchaseOrderSchema.safeParse({
      storeId: STORE_ID,
      warehouseId: WAREHOUSE_ID,
      supplierId: SUPPLIER_ID,
      items: [],
    });

    expect(parsed.success).toBe(false);
  });
});
