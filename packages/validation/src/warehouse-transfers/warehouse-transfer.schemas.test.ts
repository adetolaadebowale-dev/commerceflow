import { describe, expect, it } from "vitest";

import { createWarehouseTransferSchema } from "./warehouse-transfer.schemas";

const STORE_ID = "11111111-1111-1111-1111-111111111111";
const SOURCE_WAREHOUSE_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const DESTINATION_WAREHOUSE_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const INVENTORY_ITEM_ID = "cccccccc-cccc-cccc-cccc-cccccccccccc";

describe("createWarehouseTransferSchema", () => {
  it("accepts a valid transfer request", () => {
    const parsed = createWarehouseTransferSchema.safeParse({
      storeId: STORE_ID,
      sourceWarehouseId: SOURCE_WAREHOUSE_ID,
      destinationWarehouseId: DESTINATION_WAREHOUSE_ID,
      items: [{ inventoryItemId: INVENTORY_ITEM_ID, quantity: 3 }],
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects identical source and destination warehouses", () => {
    const parsed = createWarehouseTransferSchema.safeParse({
      storeId: STORE_ID,
      sourceWarehouseId: SOURCE_WAREHOUSE_ID,
      destinationWarehouseId: SOURCE_WAREHOUSE_ID,
      items: [{ inventoryItemId: INVENTORY_ITEM_ID, quantity: 3 }],
    });

    expect(parsed.success).toBe(false);
  });

  it("requires at least one transfer item", () => {
    const parsed = createWarehouseTransferSchema.safeParse({
      storeId: STORE_ID,
      sourceWarehouseId: SOURCE_WAREHOUSE_ID,
      destinationWarehouseId: DESTINATION_WAREHOUSE_ID,
      items: [],
    });

    expect(parsed.success).toBe(false);
  });
});
