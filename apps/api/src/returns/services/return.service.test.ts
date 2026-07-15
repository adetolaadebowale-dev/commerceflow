import { describe, expect, it } from "vitest";

import { RETURN_ERROR_CODES } from "../errors";
import {
  createMemoryReturnModule,
  seedFulfilledShipmentForReturns,
  seedInspectedReturn,
  seedRequestedReturn,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
} from "../testing/return-test-utils";
import { seedPackedShipmentWithAllocations } from "../../fulfillment/testing/fulfillment-test-utils";

describe("ReturnService", () => {
  it("creates a return for a fulfilled shipment", async () => {
    const module = createMemoryReturnModule();
    const { order, shipment, inventoryItem } =
      await seedFulfilledShipmentForReturns(module, { orderQuantity: 2 });
    const orderItem = order.items[0]!;

    const returnRecord = await module.returnService.createReturn(order.id, {
      storeId: TEST_STORE_A_ID,
      shipmentId: shipment.id,
      reason: "Customer changed mind",
      items: [
        {
          orderItemId: orderItem.id,
          inventoryItemId: inventoryItem.id,
          quantityRequested: 1,
        },
      ],
    });

    expect(returnRecord.status).toBe("requested");
    expect(returnRecord.returnNumber).toMatch(/^RTN-/);
    expect(returnRecord.items).toHaveLength(1);
    expect(returnRecord.requestedAt).toBeDefined();
  });

  it("supports partial returns within fulfilled quantity", async () => {
    const module = createMemoryReturnModule();
    const { returnRecord } = await seedRequestedReturn(module, {
      orderQuantity: 3,
      quantityRequested: 1,
    });

    expect(returnRecord.items[0]?.quantityRequested).toBe(1);
  });

  it("rejects returns when shipment is not fulfilled", async () => {
    const module = createMemoryReturnModule();
    const seeded = await seedPackedShipmentWithAllocations(module);
    const orderItem = seeded.order.items[0]!;

    await expect(
      module.returnService.createReturn(seeded.order.id, {
        storeId: TEST_STORE_A_ID,
        shipmentId: seeded.shipment.id,
        reason: "Test",
        items: [
          {
            orderItemId: orderItem.id,
            inventoryItemId: seeded.inventoryItem.id,
            quantityRequested: 1,
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: RETURN_ERROR_CODES.SHIPMENT_NOT_FULFILLED,
      status: 409,
    });
  });

  it("rejects quantities exceeding fulfilled order quantity", async () => {
    const module = createMemoryReturnModule();
    const seeded = await seedFulfilledShipmentForReturns(module, { orderQuantity: 2 });
    const orderItem = seeded.order.items[0]!;

    await expect(
      module.returnService.createReturn(seeded.order.id, {
        storeId: TEST_STORE_A_ID,
        shipmentId: seeded.shipment.id,
        reason: "Too many",
        items: [
          {
            orderItemId: orderItem.id,
            inventoryItemId: seeded.inventoryItem.id,
            quantityRequested: 3,
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: RETURN_ERROR_CODES.QUANTITY_EXCEEDED,
      status: 409,
    });
  });

  it("restocks inventory and creates positive stock movements on completion", async () => {
    const module = createMemoryReturnModule();
    const { returnRecord, inventoryItem } = await seedInspectedReturn(module, {
      condition: "new",
      quantityRequested: 2,
      quantityReceived: 2,
    });

    const before = await module.inventoryItemRepository.findById(
      TEST_STORE_A_ID,
      inventoryItem.id,
    );

    const result = await module.returnService.completeReturn(returnRecord.id, {
      storeId: TEST_STORE_A_ID,
    });

    expect(result.return.status).toBe("completed");
    expect(result.stockMovements).toHaveLength(1);
    expect(result.stockMovements[0]).toMatchObject({
      movementType: "return",
      quantity: 2,
      previousQuantityOnHand: before?.quantityOnHand,
    });

    const after = await module.inventoryItemRepository.findById(
      TEST_STORE_A_ID,
      inventoryItem.id,
    );

    expect(after?.quantityOnHand).toBe((before?.quantityOnHand ?? 0) + 2);
    expect(result.return.items[0]?.quantityRestocked).toBe(2);
  });

  it("rejects damaged items without restocking inventory", async () => {
    const module = createMemoryReturnModule();
    const { returnRecord, inventoryItem } = await seedInspectedReturn(module, {
      condition: "damaged",
      quantityRequested: 1,
      quantityReceived: 1,
    });

    const before = await module.inventoryItemRepository.findById(
      TEST_STORE_A_ID,
      inventoryItem.id,
    );

    const result = await module.returnService.completeReturn(returnRecord.id, {
      storeId: TEST_STORE_A_ID,
    });

    expect(result.return.status).toBe("rejected");
    expect(result.stockMovements).toHaveLength(0);

    const after = await module.inventoryItemRepository.findById(
      TEST_STORE_A_ID,
      inventoryItem.id,
    );

    expect(after?.quantityOnHand).toBe(before?.quantityOnHand);
  });

  it("rolls back completion when repository transaction fails", async () => {
    const module = createMemoryReturnModule();
    const { returnRecord, inventoryItem } = await seedInspectedReturn(module);

    const beforeQuantity = (
      await module.inventoryItemRepository.findById(
        TEST_STORE_A_ID,
        inventoryItem.id,
      )
    )?.quantityOnHand;

    module.returnRepository.setTransactionFailure(new Error("RETURN_ROLLBACK"));

    await expect(
      module.returnService.completeReturn(returnRecord.id, {
        storeId: TEST_STORE_A_ID,
      }),
    ).rejects.toMatchObject({
      code: RETURN_ERROR_CODES.TRANSACTION_FAILED,
      status: 500,
    });

    const inventory = await module.inventoryItemRepository.findById(
      TEST_STORE_A_ID,
      inventoryItem.id,
    );
    const unchangedReturn = await module.returnService.getReturn(
      { storeId: TEST_STORE_A_ID },
      returnRecord.id,
    );

    expect(unchangedReturn.status).toBe("inspecting");
    expect(inventory?.quantityOnHand).toBe(beforeQuantity);
  });

  it("isolates returns by store", async () => {
    const module = createMemoryReturnModule();
    const { returnRecord } = await seedRequestedReturn(module);

    await expect(
      module.returnService.getReturn({ storeId: TEST_STORE_B_ID }, returnRecord.id),
    ).rejects.toMatchObject({
      code: RETURN_ERROR_CODES.RETURN_NOT_FOUND,
      status: 404,
    });
  });

  it("lists returns for an order", async () => {
    const module = createMemoryReturnModule();
    const { order, returnRecord } = await seedRequestedReturn(module);

    const listed = await module.returnService.listReturns(order.id, {
      storeId: TEST_STORE_A_ID,
    });

    expect(listed.some((entry) => entry.id === returnRecord.id)).toBe(true);
  });

  it("prevents invalid lifecycle transitions", async () => {
    const module = createMemoryReturnModule();
    const { returnRecord } = await seedRequestedReturn(module);

    await expect(
      module.returnService.completeReturn(returnRecord.id, {
        storeId: TEST_STORE_A_ID,
      }),
    ).rejects.toMatchObject({
      code: RETURN_ERROR_CODES.INVALID_STATUS_TRANSITION,
      status: 409,
    });
  });
});
