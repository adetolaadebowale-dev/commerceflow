import { describe, expect, it } from "vitest";

import { PURCHASE_ORDER_ERROR_CODES } from "../errors";
import {
  createMemoryPurchaseOrderModule,
  seedDraftPurchaseOrder,
  seedOrderedPurchaseOrder,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
} from "../testing/purchase-order-test-utils";

describe("PurchaseOrderService", () => {
  it("creates a draft purchase order without changing inventory", async () => {
    const module = createMemoryPurchaseOrderModule();
    const { inventoryItem, purchaseOrder } = await seedDraftPurchaseOrder(module);

    expect(purchaseOrder.status).toBe("draft");
    expect(purchaseOrder.purchaseOrderNumber).toMatch(/^PO-/);
    expect(purchaseOrder.items[0]).toMatchObject({
      productVariantId: inventoryItem.productVariantId,
      quantityOrdered: 10,
      quantityReceived: 0,
    });

    const unchanged = await module.inventoryItemRepository.findById(
      TEST_STORE_A_ID,
      inventoryItem.id,
    );
    expect(unchanged?.quantityOnHand).toBe(0);
  });

  it("completes lifecycle with partial and full receiving", async () => {
    const module = createMemoryPurchaseOrderModule();
    const { inventoryItem, purchaseOrder } = await seedOrderedPurchaseOrder(module, {
      quantityOrdered: 10,
    });
    const item = purchaseOrder.items[0]!;

    const partial = await module.purchaseOrderService.receivePurchaseOrder(
      purchaseOrder.id,
      {
        storeId: TEST_STORE_A_ID,
        items: [{ purchaseOrderItemId: item.id, quantityReceived: 4 }],
      },
    );

    expect(partial.purchaseOrder.status).toBe("partially_received");
    expect(partial.stockMovements).toHaveLength(1);
    expect(partial.stockMovements[0]).toMatchObject({
      movementType: "adjustment",
      quantity: 4,
      warehouseId: inventoryItem.warehouseId,
    });

    let onHand = await module.inventoryItemRepository.findById(
      TEST_STORE_A_ID,
      inventoryItem.id,
    );
    expect(onHand?.quantityOnHand).toBe(4);

    const complete = await module.purchaseOrderService.receivePurchaseOrder(
      purchaseOrder.id,
      {
        storeId: TEST_STORE_A_ID,
        items: [{ purchaseOrderItemId: item.id, quantityReceived: 6 }],
      },
    );

    expect(complete.purchaseOrder.status).toBe("received");
    expect(complete.purchaseOrder.receivedAt).toBeDefined();
    expect(complete.purchaseOrder.items[0]?.quantityReceived).toBe(10);

    onHand = await module.inventoryItemRepository.findById(
      TEST_STORE_A_ID,
      inventoryItem.id,
    );
    expect(onHand?.quantityOnHand).toBe(10);
  });

  it("rejects receiving more than the remaining ordered quantity", async () => {
    const module = createMemoryPurchaseOrderModule();
    const { purchaseOrder } = await seedOrderedPurchaseOrder(module, {
      quantityOrdered: 5,
    });
    const item = purchaseOrder.items[0]!;

    await expect(
      module.purchaseOrderService.receivePurchaseOrder(purchaseOrder.id, {
        storeId: TEST_STORE_A_ID,
        items: [{ purchaseOrderItemId: item.id, quantityReceived: 6 }],
      }),
    ).rejects.toMatchObject({
      code: PURCHASE_ORDER_ERROR_CODES.RECEIPT_EXCEEDS_REMAINING,
      status: 409,
    });
  });

  it("rejects receiving against an already fully received line item", async () => {
    const module = createMemoryPurchaseOrderModule();
    const { inventoryItem, purchaseOrder } = await seedOrderedPurchaseOrder(module, {
      quantityOrdered: 5,
    });

    const secondVariantId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    module.inventoryItemRepository.seedProductVariant(
      TEST_STORE_A_ID,
      secondVariantId,
    );

    const extended = await module.purchaseOrderService.createPurchaseOrder({
      storeId: TEST_STORE_A_ID,
      warehouseId: inventoryItem.warehouseId,
      supplierId: purchaseOrder.supplierId,
      items: [
        {
          productVariantId: inventoryItem.productVariantId,
          quantityOrdered: 2,
          unitCost: "5.00",
          currency: "USD",
        },
        {
          productVariantId: secondVariantId,
          quantityOrdered: 8,
          unitCost: "7.00",
          currency: "USD",
        },
      ],
    });

    const approved = await module.purchaseOrderService.approvePurchaseOrder(
      extended.id,
      { storeId: TEST_STORE_A_ID },
    );
    const ordered = await module.purchaseOrderService.orderPurchaseOrder(
      approved.id,
      { storeId: TEST_STORE_A_ID },
    );

    const firstItem = ordered.items[0]!;

    await module.purchaseOrderService.receivePurchaseOrder(ordered.id, {
      storeId: TEST_STORE_A_ID,
      items: [{ purchaseOrderItemId: firstItem.id, quantityReceived: 2 }],
    });

    await expect(
      module.purchaseOrderService.receivePurchaseOrder(ordered.id, {
        storeId: TEST_STORE_A_ID,
        items: [{ purchaseOrderItemId: firstItem.id, quantityReceived: 1 }],
      }),
    ).rejects.toMatchObject({
      code: PURCHASE_ORDER_ERROR_CODES.ITEM_ALREADY_RECEIVED,
      status: 409,
    });
  });

  it("prevents duplicate receiving on fully received purchase orders", async () => {
    const module = createMemoryPurchaseOrderModule();
    const { purchaseOrder } = await seedOrderedPurchaseOrder(module, {
      quantityOrdered: 3,
    });
    const item = purchaseOrder.items[0]!;

    await module.purchaseOrderService.receivePurchaseOrder(purchaseOrder.id, {
      storeId: TEST_STORE_A_ID,
      items: [{ purchaseOrderItemId: item.id, quantityReceived: 3 }],
    });

    await expect(
      module.purchaseOrderService.receivePurchaseOrder(purchaseOrder.id, {
        storeId: TEST_STORE_A_ID,
        items: [{ purchaseOrderItemId: item.id, quantityReceived: 1 }],
      }),
    ).rejects.toMatchObject({
      code: PURCHASE_ORDER_ERROR_CODES.INVALID_STATUS_TRANSITION,
      status: 409,
    });
  });

  it("only allows ordering from approved status", async () => {
    const module = createMemoryPurchaseOrderModule();
    const { purchaseOrder } = await seedDraftPurchaseOrder(module);

    await expect(
      module.purchaseOrderService.orderPurchaseOrder(purchaseOrder.id, {
        storeId: TEST_STORE_A_ID,
      }),
    ).rejects.toMatchObject({
      code: PURCHASE_ORDER_ERROR_CODES.INVALID_STATUS_TRANSITION,
      status: 409,
    });
  });

  it("rolls back receive when repository transaction fails", async () => {
    const module = createMemoryPurchaseOrderModule();
    const { inventoryItem, purchaseOrder } = await seedOrderedPurchaseOrder(module);
    const item = purchaseOrder.items[0]!;

    module.purchaseOrderRepository.setTransactionFailure(
      new Error("PO_ROLLBACK"),
    );

    await expect(
      module.purchaseOrderService.receivePurchaseOrder(purchaseOrder.id, {
        storeId: TEST_STORE_A_ID,
        items: [{ purchaseOrderItemId: item.id, quantityReceived: 2 }],
      }),
    ).rejects.toMatchObject({
      code: PURCHASE_ORDER_ERROR_CODES.TRANSACTION_FAILED,
      status: 500,
    });

    const unchanged = await module.inventoryItemRepository.findById(
      TEST_STORE_A_ID,
      inventoryItem.id,
    );
    const unchangedOrder = await module.purchaseOrderService.getPurchaseOrder(
      { storeId: TEST_STORE_A_ID },
      purchaseOrder.id,
    );

    expect(unchangedOrder.status).toBe("ordered");
    expect(unchanged?.quantityOnHand).toBe(0);
  });

  it("enforces tenant isolation", async () => {
    const module = createMemoryPurchaseOrderModule();
    const { purchaseOrder } = await seedDraftPurchaseOrder(module);

    await expect(
      module.purchaseOrderService.getPurchaseOrder(
        { storeId: TEST_STORE_B_ID },
        purchaseOrder.id,
      ),
    ).rejects.toMatchObject({
      code: PURCHASE_ORDER_ERROR_CODES.PURCHASE_ORDER_NOT_FOUND,
      status: 404,
    });
  });
});
