import { describe, expect, it } from "vitest";

import { PICK_LIST_ERROR_CODES } from "../errors";
import {
  createMemoryPickListModule,
  fullyPickedItems,
  seedPendingPickList,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
} from "../testing/pick-list-test-utils";
import { createPendingShipment } from "@/shipments/testing/shipment-test-utils";

describe("PickListService", () => {
  it("creates a pick list from order items", async () => {
    const module = createMemoryPickListModule();
    const { order, shipment } = await createPendingShipment(module);

    const pickList = await module.pickListService.createPickList(
      TEST_STORE_A_ID,
      shipment.id,
      {},
    );

    expect(pickList.shipmentId).toBe(shipment.id);
    expect(pickList.status).toBe("pending");
    expect(pickList.items).toHaveLength(order.items.length);
    expect(pickList.items[0]?.quantityRequired).toBe(order.items[0]?.quantity);
    expect(pickList.items[0]?.quantityPicked).toBe(0);
  });

  it("runs the pick list lifecycle", async () => {
    const module = createMemoryPickListModule();
    const { pickList } = await seedPendingPickList(module);

    const started = await module.pickListService.startPicking(
      TEST_STORE_A_ID,
      pickList.id,
    );
    expect(started.status).toBe("picking");
    expect(started.startedAt).toBeDefined();

    const picked = await module.pickListService.completePicking(
      TEST_STORE_A_ID,
      pickList.id,
      fullyPickedItems(pickList),
    );
    expect(picked.status).toBe("picked");
    expect(picked.completedAt).toBeDefined();

    const packed = await module.pickListService.markPacked(
      TEST_STORE_A_ID,
      pickList.id,
    );
    expect(packed.status).toBe("packed");
  });

  it("rejects a second active pick list for the same shipment", async () => {
    const module = createMemoryPickListModule();
    const { shipment } = await seedPendingPickList(module);

    await expect(
      module.pickListService.createPickList(TEST_STORE_A_ID, shipment.id, {}),
    ).rejects.toMatchObject({
      code: PICK_LIST_ERROR_CODES.ACTIVE_PICK_LIST_EXISTS,
      status: 409,
    });
  });

  it("rejects quantities above required amounts", async () => {
    const module = createMemoryPickListModule();
    const { pickList } = await seedPendingPickList(module);

    await module.pickListService.startPicking(TEST_STORE_A_ID, pickList.id);

    await expect(
      module.pickListService.completePicking(TEST_STORE_A_ID, pickList.id, {
        items: [
          {
            orderItemId: pickList.items[0]!.orderItemId,
            quantityPicked: pickList.items[0]!.quantityRequired + 1,
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: PICK_LIST_ERROR_CODES.QUANTITY_EXCEEDED,
      status: 400,
    });
  });

  it("requires picking before packing", async () => {
    const module = createMemoryPickListModule();
    const { pickList } = await seedPendingPickList(module);

    await expect(
      module.pickListService.markPacked(TEST_STORE_A_ID, pickList.id),
    ).rejects.toMatchObject({
      code: PICK_LIST_ERROR_CODES.PICKING_NOT_COMPLETE,
      status: 409,
    });
  });

  it("rejects pick list creation for cancelled shipments", async () => {
    const module = createMemoryPickListModule();
    const { shipment } = await createPendingShipment(module);

    await module.shipmentService.cancelShipment(
      { storeId: TEST_STORE_A_ID },
      shipment.id,
    );

    await expect(
      module.pickListService.createPickList(TEST_STORE_A_ID, shipment.id, {}),
    ).rejects.toMatchObject({
      code: PICK_LIST_ERROR_CODES.SHIPMENT_NOT_ELIGIBLE,
      status: 409,
    });
  });

  it("isolates pick lists by store", async () => {
    const module = createMemoryPickListModule();
    const { shipment, pickList } = await seedPendingPickList(module);

    await expect(
      module.pickListService.getPickList(TEST_STORE_B_ID, pickList.id),
    ).rejects.toMatchObject({
      code: PICK_LIST_ERROR_CODES.PICK_LIST_NOT_FOUND,
      status: 404,
    });

    await expect(
      module.pickListService.listShipmentPickLists(
        { storeId: TEST_STORE_B_ID },
        shipment.id,
      ),
    ).rejects.toMatchObject({
      code: PICK_LIST_ERROR_CODES.SHIPMENT_NOT_FOUND,
      status: 404,
    });
  });

  it("rolls back when the repository transaction fails", async () => {
    const module = createMemoryPickListModule();
    const { shipment } = await createPendingShipment(module);
    module.pickListRepository.setTransactionFailure(new Error("db failure"));

    await expect(
      module.pickListService.createPickList(TEST_STORE_A_ID, shipment.id, {}),
    ).rejects.toMatchObject({
      code: PICK_LIST_ERROR_CODES.TRANSACTION_FAILED,
      status: 500,
    });

    module.pickListRepository.setTransactionFailure(null);

    const pickLists = await module.pickListService.listShipmentPickLists(
      { storeId: TEST_STORE_A_ID },
      shipment.id,
    );
    expect(pickLists).toHaveLength(0);
  });
});
