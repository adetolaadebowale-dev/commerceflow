import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryWarehouseTransferModule,
  seedDraftWarehouseTransfer,
  TEST_STORE_A_ID,
} from "../testing/warehouse-transfer-test-utils";

describe("WarehouseTransferService domain events", () => {
  it("emits warehouse transfer lifecycle and stock movement events", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const createdHandler = vi.fn();
    const approvedHandler = vi.fn();
    const shippedHandler = vi.fn();
    const receivedHandler = vi.fn();
    const stockMovementHandler = vi.fn();

    dispatcher.subscribe("warehouse-transfer.created", createdHandler);
    dispatcher.subscribe("warehouse-transfer.approved", approvedHandler);
    dispatcher.subscribe("warehouse-transfer.shipped", shippedHandler);
    dispatcher.subscribe("warehouse-transfer.received", receivedHandler);
    dispatcher.subscribe("stock-movement.created", stockMovementHandler);

    const module = createMemoryWarehouseTransferModule({
      domainEventPublisher: publisher,
    });
    const { warehouseTransfer } = await seedDraftWarehouseTransfer(module);

    await module.warehouseTransferService.approveWarehouseTransfer(
      warehouseTransfer.id,
      { storeId: TEST_STORE_A_ID },
    );
    await module.warehouseTransferService.shipWarehouseTransfer(
      warehouseTransfer.id,
      { storeId: TEST_STORE_A_ID },
    );
    await module.warehouseTransferService.receiveWarehouseTransfer(
      warehouseTransfer.id,
      { storeId: TEST_STORE_A_ID },
    );

    await vi.waitFor(() => {
      expect(createdHandler).toHaveBeenCalledOnce();
      expect(approvedHandler).toHaveBeenCalledOnce();
      expect(shippedHandler).toHaveBeenCalledOnce();
      expect(receivedHandler).toHaveBeenCalledOnce();
      expect(stockMovementHandler).toHaveBeenCalledTimes(2);
    });
  });

  it("emits cancelled event", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const cancelledHandler = vi.fn();

    dispatcher.subscribe("warehouse-transfer.cancelled", cancelledHandler);

    const module = createMemoryWarehouseTransferModule({
      domainEventPublisher: publisher,
    });
    const { warehouseTransfer } = await seedDraftWarehouseTransfer(module);

    await module.warehouseTransferService.cancelWarehouseTransfer(
      warehouseTransfer.id,
      { storeId: TEST_STORE_A_ID },
    );

    await vi.waitFor(() => {
      expect(cancelledHandler).toHaveBeenCalledOnce();
    });
  });
});
