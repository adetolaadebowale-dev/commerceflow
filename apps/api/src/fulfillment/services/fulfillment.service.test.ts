import { describe, expect, it } from "vitest";

import { FULFILLMENT_ERROR_CODES } from "../errors";
import { seedConfirmedOrderWithInventory } from "../../reservations/testing/reservation-test-utils";
import {
  createMemoryFulfillmentService,
  seedConfirmedReservedOrder,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
} from "../testing/fulfillment-test-utils";

describe("FulfillmentService", () => {
  it("fulfills a confirmed order with active reservations", async () => {
    const services = createMemoryFulfillmentService();
    const { inventoryItem, confirmed } = await seedConfirmedReservedOrder(
      services,
      { initialQuantity: 10, orderQuantity: 2 },
    );

    const result = await services.fulfillmentService.fulfillOrder(
      { storeId: TEST_STORE_A_ID },
      confirmed.id,
    );

    expect(result.order.status).toBe("fulfilled");
    expect(result.order.fulfilledAt).toBeDefined();
    expect(result.order.confirmedAt).toBeDefined();
    expect(result.reservations).toHaveLength(1);
    expect(result.reservations[0]?.status).toBe("fulfilled");
    expect(result.reservations[0]?.fulfilledAt).toBeDefined();
    expect(result.stockMovements).toHaveLength(1);
    expect(result.stockMovements[0]).toMatchObject({
      inventoryItemId: inventoryItem.id,
      quantityChange: -2,
      quantityAfter: 8,
      reason: "sale_fulfilled",
    });
    expect(result.inventoryItems[0]?.quantityOnHand).toBe(8);
  });

  it("deducts inventory quantity on fulfillment", async () => {
    const services = createMemoryFulfillmentService();
    const { inventoryItem, confirmed } = await seedConfirmedReservedOrder(
      services,
      { initialQuantity: 10, orderQuantity: 4 },
    );

    await services.fulfillmentService.fulfillOrder(
      { storeId: TEST_STORE_A_ID },
      confirmed.id,
    );

    const updated = await services.inventoryItemRepository.findById(
      TEST_STORE_A_ID,
      inventoryItem.id,
    );
    expect(updated?.quantityOnHand).toBe(6);
  });

  it("creates immutable stock movement records for each fulfilled line", async () => {
    const services = createMemoryFulfillmentService();
    const { confirmed } = await seedConfirmedReservedOrder(services);

    const result = await services.fulfillmentService.fulfillOrder(
      { storeId: TEST_STORE_A_ID },
      confirmed.id,
    );

    const movements = services.inventoryItemRepository.getAllMovements();
    expect(movements.some((movement) => movement.id === result.stockMovements[0]?.id)).toBe(
      true,
    );
    expect(result.stockMovements[0]?.reason).toBe("sale_fulfilled");
  });

  it("finalizes reservations while keeping them queryable", async () => {
    const services = createMemoryFulfillmentService();
    const { confirmed, reservations } = await seedConfirmedReservedOrder(services);

    await services.fulfillmentService.fulfillOrder(
      { storeId: TEST_STORE_A_ID },
      confirmed.id,
    );

    const listed = await services.reservationService.listOrderReservations(
      { storeId: TEST_STORE_A_ID },
      confirmed.id,
    );

    expect(listed).toHaveLength(1);
    expect(listed[0]?.id).toBe(reservations[0]?.id);
    expect(listed[0]?.status).toBe("fulfilled");
  });

  it("rejects repeated fulfillment", async () => {
    const services = createMemoryFulfillmentService();
    const { confirmed } = await seedConfirmedReservedOrder(services);

    await services.fulfillmentService.fulfillOrder(
      { storeId: TEST_STORE_A_ID },
      confirmed.id,
    );

    await expect(
      services.fulfillmentService.fulfillOrder(
        { storeId: TEST_STORE_A_ID },
        confirmed.id,
      ),
    ).rejects.toMatchObject({
      code: FULFILLMENT_ERROR_CODES.ORDER_ALREADY_FULFILLED,
      status: 409,
    });
  });

  it("rejects fulfillment without active reservations", async () => {
    const services = createMemoryFulfillmentService();
    const { confirmed } = await seedConfirmedOrderWithInventory(services);

    await expect(
      services.fulfillmentService.fulfillOrder(
        { storeId: TEST_STORE_A_ID },
        confirmed.id,
      ),
    ).rejects.toMatchObject({
      code: FULFILLMENT_ERROR_CODES.NO_ACTIVE_RESERVATIONS,
      status: 409,
    });
  });

  it("rejects fulfillment when reservations were released", async () => {
    const services = createMemoryFulfillmentService();
    const { confirmed, reservations } = await seedConfirmedReservedOrder(services);

    await services.reservationService.releaseReservation(
      { storeId: TEST_STORE_A_ID },
      reservations[0]!.id,
    );

    await expect(
      services.fulfillmentService.fulfillOrder(
        { storeId: TEST_STORE_A_ID },
        confirmed.id,
      ),
    ).rejects.toMatchObject({
      code: FULFILLMENT_ERROR_CODES.NO_ACTIVE_RESERVATIONS,
      status: 409,
    });
  });

  it("does not persist fulfillment when transaction fails", async () => {
    const services = createMemoryFulfillmentService();
    const { inventoryItem, confirmed } = await seedConfirmedReservedOrder(
      services,
      { initialQuantity: 10, orderQuantity: 2 },
    );

    services.fulfillmentRepository.setTransactionFailure(
      new Error("simulated fulfillment failure"),
    );

    await expect(
      services.fulfillmentService.fulfillOrder(
        { storeId: TEST_STORE_A_ID },
        confirmed.id,
      ),
    ).rejects.toThrow("simulated fulfillment failure");

    const order = await services.orderService.getOrder(
      TEST_STORE_A_ID,
      confirmed.id,
    );
    expect(order.status).toBe("confirmed");

    const inventory = await services.inventoryItemRepository.findById(
      TEST_STORE_A_ID,
      inventoryItem.id,
    );
    expect(inventory?.quantityOnHand).toBe(10);
  });

  it("isolates fulfillment by store", async () => {
    const services = createMemoryFulfillmentService();
    const { confirmed } = await seedConfirmedReservedOrder(services);

    await expect(
      services.fulfillmentService.fulfillOrder(
        { storeId: TEST_STORE_B_ID },
        confirmed.id,
      ),
    ).rejects.toMatchObject({
      code: FULFILLMENT_ERROR_CODES.ORDER_NOT_FOUND,
      status: 404,
    });
  });
});
