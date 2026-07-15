import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryPurchaseOrderModule,
  seedDraftPurchaseOrder,
  TEST_STORE_A_ID,
} from "../testing/purchase-order-test-utils";

describe("PurchaseOrderService domain events", () => {
  it("emits purchase order lifecycle and stock movement events", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const createdHandler = vi.fn();
    const approvedHandler = vi.fn();
    const orderedHandler = vi.fn();
    const receivedHandler = vi.fn();
    const stockMovementHandler = vi.fn();

    dispatcher.subscribe("purchase-order.created", createdHandler);
    dispatcher.subscribe("purchase-order.approved", approvedHandler);
    dispatcher.subscribe("purchase-order.ordered", orderedHandler);
    dispatcher.subscribe("purchase-order.received", receivedHandler);
    dispatcher.subscribe("stock-movement.created", stockMovementHandler);

    const module = createMemoryPurchaseOrderModule({
      domainEventPublisher: publisher,
    });
    const { purchaseOrder } = await seedDraftPurchaseOrder(module);
    const item = purchaseOrder.items[0]!;

    await module.purchaseOrderService.approvePurchaseOrder(purchaseOrder.id, {
      storeId: TEST_STORE_A_ID,
    });
    await module.purchaseOrderService.orderPurchaseOrder(purchaseOrder.id, {
      storeId: TEST_STORE_A_ID,
    });
    await module.purchaseOrderService.receivePurchaseOrder(purchaseOrder.id, {
      storeId: TEST_STORE_A_ID,
      items: [{ purchaseOrderItemId: item.id, quantityReceived: 5 }],
    });

    await vi.waitFor(() => {
      expect(createdHandler).toHaveBeenCalledOnce();
      expect(approvedHandler).toHaveBeenCalledOnce();
      expect(orderedHandler).toHaveBeenCalledOnce();
      expect(receivedHandler).toHaveBeenCalledOnce();
      expect(stockMovementHandler).toHaveBeenCalledOnce();
    });
  });
});
