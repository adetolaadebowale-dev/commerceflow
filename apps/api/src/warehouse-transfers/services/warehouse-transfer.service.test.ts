import { describe, expect, it } from "vitest";

import { WAREHOUSE_TRANSFER_ERROR_CODES } from "../errors";
import { WarehouseTransferStatusTransitionPolicy } from "../policies/warehouse-transfer-status-transition.policy";
import {
  createMemoryWarehouseTransferModule,
  seedApprovedWarehouseTransfer,
  seedDraftWarehouseTransfer,
  seedShippedWarehouseTransfer,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
} from "../testing/warehouse-transfer-test-utils";

describe("WarehouseTransferStatusTransitionPolicy", () => {
  it("allows draft → approved → in_transit → received", () => {
    expect(
      WarehouseTransferStatusTransitionPolicy.canTransition("draft", "approved"),
    ).toBe(true);
    expect(
      WarehouseTransferStatusTransitionPolicy.canTransition("approved", "in_transit"),
    ).toBe(true);
    expect(
      WarehouseTransferStatusTransitionPolicy.canTransition("in_transit", "received"),
    ).toBe(true);
  });
});

describe("WarehouseTransferService", () => {
  it("creates a draft warehouse transfer", async () => {
    const module = createMemoryWarehouseTransferModule();
    const { inventoryItem, warehouseTransfer } =
      await seedDraftWarehouseTransfer(module);

    expect(warehouseTransfer.status).toBe("draft");
    expect(warehouseTransfer.transferNumber).toMatch(/^XFR-/);
    expect(warehouseTransfer.items[0]).toMatchObject({
      inventoryItemId: inventoryItem.id,
      quantity: 5,
    });

    const unchanged = await module.inventoryItemRepository.findById(
      TEST_STORE_A_ID,
      inventoryItem.id,
    );
    expect(unchanged?.quantityOnHand).toBe(20);
  });

  it("completes the full transfer lifecycle", async () => {
    const module = createMemoryWarehouseTransferModule();
    const { inventoryItem, destinationWarehouse, warehouseTransfer } =
      await seedDraftWarehouseTransfer(module, {
        initialQuantity: 20,
        transferQuantity: 8,
      });

    const approved = await module.warehouseTransferService.approveWarehouseTransfer(
      warehouseTransfer.id,
      { storeId: TEST_STORE_A_ID },
    );
    expect(approved.status).toBe("approved");

    const afterApprove = await module.inventoryItemRepository.findById(
      TEST_STORE_A_ID,
      inventoryItem.id,
    );
    expect(afterApprove?.quantityOnHand).toBe(20);

    const shipResult = await module.warehouseTransferService.shipWarehouseTransfer(
      warehouseTransfer.id,
      { storeId: TEST_STORE_A_ID },
    );
    expect(shipResult.warehouseTransfer.status).toBe("in_transit");
    expect(shipResult.stockMovements).toHaveLength(1);
    expect(shipResult.stockMovements[0]).toMatchObject({
      movementType: "transfer",
      quantity: -8,
      warehouseId: inventoryItem.warehouseId,
    });

    const afterShip = await module.inventoryItemRepository.findById(
      TEST_STORE_A_ID,
      inventoryItem.id,
    );
    expect(afterShip?.quantityOnHand).toBe(12);

    const receiveResult =
      await module.warehouseTransferService.receiveWarehouseTransfer(
        warehouseTransfer.id,
        { storeId: TEST_STORE_A_ID },
      );
    expect(receiveResult.warehouseTransfer.status).toBe("received");
    expect(receiveResult.stockMovements).toHaveLength(1);
    expect(receiveResult.stockMovements[0]).toMatchObject({
      movementType: "transfer",
      quantity: 8,
      warehouseId: destinationWarehouse.id,
    });

    const destinationInventory =
      await module.inventoryItemRepository.findByProductVariantId(
        TEST_STORE_A_ID,
        destinationWarehouse.id,
        inventoryItem.productVariantId,
      );
    expect(destinationInventory?.quantityOnHand).toBe(8);
  });

  it("rejects approval when inventory is insufficient", async () => {
    const module = createMemoryWarehouseTransferModule();
    const { warehouseTransfer } = await seedDraftWarehouseTransfer(module, {
      initialQuantity: 3,
      transferQuantity: 5,
    });

    await expect(
      module.warehouseTransferService.approveWarehouseTransfer(
        warehouseTransfer.id,
        { storeId: TEST_STORE_A_ID },
      ),
    ).rejects.toMatchObject({
      code: WAREHOUSE_TRANSFER_ERROR_CODES.INSUFFICIENT_STOCK,
      status: 409,
    });
  });

  it("rejects ship when inventory drops below transfer quantity", async () => {
    const module = createMemoryWarehouseTransferModule();
    const { inventoryItem, warehouseTransfer } = await seedApprovedWarehouseTransfer(
      module,
      { initialQuantity: 10, transferQuantity: 6 },
    );

    await module.inventoryItemRepository.adjustStock({
      storeId: TEST_STORE_A_ID,
      inventoryItemId: inventoryItem.id,
      quantityChange: -6,
      reason: "manual_adjustment",
    });

    await expect(
      module.warehouseTransferService.shipWarehouseTransfer(warehouseTransfer.id, {
        storeId: TEST_STORE_A_ID,
      }),
    ).rejects.toMatchObject({
      code: WAREHOUSE_TRANSFER_ERROR_CODES.INSUFFICIENT_STOCK,
      status: 409,
    });

    const unchanged = await module.inventoryItemRepository.findById(
      TEST_STORE_A_ID,
      inventoryItem.id,
    );
    expect(unchanged?.quantityOnHand).toBe(4);
  });

  it("rolls back ship when repository transaction fails", async () => {
    const module = createMemoryWarehouseTransferModule();
    const { inventoryItem, warehouseTransfer } = await seedApprovedWarehouseTransfer(
      module,
    );

    const beforeQuantity = (
      await module.inventoryItemRepository.findById(
        TEST_STORE_A_ID,
        inventoryItem.id,
      )
    )?.quantityOnHand;

    module.warehouseTransferRepository.setTransactionFailure(
      new Error("TRANSFER_ROLLBACK"),
    );

    await expect(
      module.warehouseTransferService.shipWarehouseTransfer(warehouseTransfer.id, {
        storeId: TEST_STORE_A_ID,
      }),
    ).rejects.toMatchObject({
      code: WAREHOUSE_TRANSFER_ERROR_CODES.TRANSACTION_FAILED,
      status: 500,
    });

    const unchanged = await module.inventoryItemRepository.findById(
      TEST_STORE_A_ID,
      inventoryItem.id,
    );
    const unchangedTransfer =
      await module.warehouseTransferService.getWarehouseTransfer(
        { storeId: TEST_STORE_A_ID },
        warehouseTransfer.id,
      );

    expect(unchangedTransfer.status).toBe("approved");
    expect(unchanged?.quantityOnHand).toBe(beforeQuantity);
  });

  it("enforces tenant isolation", async () => {
    const module = createMemoryWarehouseTransferModule();
    const { warehouseTransfer } = await seedDraftWarehouseTransfer(module);

    await expect(
      module.warehouseTransferService.getWarehouseTransfer(
        { storeId: TEST_STORE_B_ID },
        warehouseTransfer.id,
      ),
    ).rejects.toMatchObject({
      code: WAREHOUSE_TRANSFER_ERROR_CODES.WAREHOUSE_TRANSFER_NOT_FOUND,
      status: 404,
    });
  });

  it("cancels draft transfers without changing inventory", async () => {
    const module = createMemoryWarehouseTransferModule();
    const { inventoryItem, warehouseTransfer } =
      await seedDraftWarehouseTransfer(module);

    const cancelled = await module.warehouseTransferService.cancelWarehouseTransfer(
      warehouseTransfer.id,
      { storeId: TEST_STORE_A_ID },
    );

    expect(cancelled.status).toBe("cancelled");

    const unchanged = await module.inventoryItemRepository.findById(
      TEST_STORE_A_ID,
      inventoryItem.id,
    );
    expect(unchanged?.quantityOnHand).toBe(20);
  });

  it("rejects invalid lifecycle transitions", async () => {
    const module = createMemoryWarehouseTransferModule();
    const { warehouseTransfer } = await seedShippedWarehouseTransfer(module);

    await expect(
      module.warehouseTransferService.receiveWarehouseTransfer(
        warehouseTransfer.id,
        { storeId: TEST_STORE_A_ID },
      ),
    ).resolves.toMatchObject({
      warehouseTransfer: { status: "received" },
    });

    await expect(
      module.warehouseTransferService.shipWarehouseTransfer(warehouseTransfer.id, {
        storeId: TEST_STORE_A_ID,
      }),
    ).rejects.toMatchObject({
      code: WAREHOUSE_TRANSFER_ERROR_CODES.WAREHOUSE_TRANSFER_IMMUTABLE,
      status: 409,
    });
  });
});
