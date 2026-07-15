import { describe, expect, it } from "vitest";

import { seedDefaultWarehouse } from "@/warehouses/testing/warehouse-test-utils";
import { RESERVATION_ERROR_CODES } from "../errors";
import {
  createMemoryReservationService,
  seedConfirmedOrderWithInventory,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  TEST_VARIANT_A_ID,
} from "../testing/reservation-test-utils";

describe("ReservationService", () => {
  it("reserves inventory for a confirmed order without changing quantityOnHand", async () => {
    const services = createMemoryReservationService();
    const { inventoryItem, confirmed } =
      await seedConfirmedOrderWithInventory(services);

    const reservations = await services.reservationService.reserveOrder(
      { storeId: TEST_STORE_A_ID },
      confirmed.id,
    );

    expect(reservations).toHaveLength(1);
    expect(reservations[0]).toMatchObject({
      storeId: TEST_STORE_A_ID,
      orderId: confirmed.id,
      orderItemId: confirmed.items[0]?.id,
      inventoryItemId: inventoryItem.id,
      reservedQuantity: 2,
      status: "active",
    });
    expect(reservations[0]?.releasedAt).toBeUndefined();

    const unchanged = await services.inventoryItemRepository.findById(
      TEST_STORE_A_ID,
      inventoryItem.id,
    );
    expect(unchanged?.quantityOnHand).toBe(10);
  });

  it("rejects reservation when available stock is insufficient", async () => {
    const services = createMemoryReservationService();
    const { confirmed } = await seedConfirmedOrderWithInventory(services, {
      initialQuantity: 5,
      orderQuantity: 6,
    });

    await expect(
      services.reservationService.reserveOrder(
        { storeId: TEST_STORE_A_ID },
        confirmed.id,
      ),
    ).rejects.toMatchObject({
      code: RESERVATION_ERROR_CODES.INSUFFICIENT_STOCK,
      status: 409,
    });

    expect(services.reservationRepository.getReservationCount()).toBe(0);
  });

  it("handles multiple orders competing for the same inventory", async () => {
    const services = createMemoryReservationService();
    const existingWarehouse =
      await services.warehouseRepository.findDefaultByStoreId(TEST_STORE_A_ID);
    const warehouse =
      existingWarehouse ??
      (await seedDefaultWarehouse(services.warehouseService, {
        storeId: TEST_STORE_A_ID,
      }));

    services.inventoryItemRepository.seedProductVariant(
      TEST_STORE_A_ID,
      TEST_VARIANT_A_ID,
    );
    services.variantSnapshotReader.seedVariant({
      storeId: TEST_STORE_A_ID,
      productVariantId: TEST_VARIANT_A_ID,
      productName: "Classic Tee",
      sku: "TEE-001",
      unitPrice: "19.99",
      currency: "USD",
      isActive: true,
    });

    await services.inventoryService.createInventoryItem({
      storeId: TEST_STORE_A_ID,
      warehouseId: warehouse.id,
      productVariantId: TEST_VARIANT_A_ID,
      initialQuantity: 5,
    });

    const firstDraft = await services.orderService.createOrder({
      storeId: TEST_STORE_A_ID,
      status: "draft",
      items: [{ productVariantId: TEST_VARIANT_A_ID, quantity: 3 }],
    });
    const secondDraft = await services.orderService.createOrder({
      storeId: TEST_STORE_A_ID,
      status: "draft",
      items: [{ productVariantId: TEST_VARIANT_A_ID, quantity: 3 }],
    });

    const firstConfirmed = await services.orderService.confirmOrder(
      { storeId: TEST_STORE_A_ID },
      firstDraft.id,
    );
    const secondConfirmed = await services.orderService.confirmOrder(
      { storeId: TEST_STORE_A_ID },
      secondDraft.id,
    );

    await services.reservationService.reserveOrder(
      { storeId: TEST_STORE_A_ID },
      firstConfirmed.id,
    );

    await expect(
      services.reservationService.reserveOrder(
        { storeId: TEST_STORE_A_ID },
        secondConfirmed.id,
      ),
    ).rejects.toMatchObject({
      code: RESERVATION_ERROR_CODES.INSUFFICIENT_STOCK,
      status: 409,
    });
  });

  it("releases an active reservation and sets releasedAt", async () => {
    const services = createMemoryReservationService();
    const { confirmed } = await seedConfirmedOrderWithInventory(services);

    const [reservation] = await services.reservationService.reserveOrder(
      { storeId: TEST_STORE_A_ID },
      confirmed.id,
    );

    const released = await services.reservationService.releaseReservation(
      { storeId: TEST_STORE_A_ID },
      reservation!.id,
    );

    expect(released.status).toBe("released");
    expect(released.releasedAt).toBeDefined();
  });

  it("rejects releasing a reservation that is already released", async () => {
    const services = createMemoryReservationService();
    const { confirmed } = await seedConfirmedOrderWithInventory(services);

    const [reservation] = await services.reservationService.reserveOrder(
      { storeId: TEST_STORE_A_ID },
      confirmed.id,
    );

    await services.reservationService.releaseReservation(
      { storeId: TEST_STORE_A_ID },
      reservation!.id,
    );

    await expect(
      services.reservationService.releaseReservation(
        { storeId: TEST_STORE_A_ID },
        reservation!.id,
      ),
    ).rejects.toMatchObject({
      code: RESERVATION_ERROR_CODES.ALREADY_RELEASED,
      status: 409,
    });
  });

  it("rejects reservation for non-confirmed orders", async () => {
    const services = createMemoryReservationService();
    const existingWarehouse =
      await services.warehouseRepository.findDefaultByStoreId(TEST_STORE_A_ID);
    const warehouse =
      existingWarehouse ??
      (await seedDefaultWarehouse(services.warehouseService, {
        storeId: TEST_STORE_A_ID,
      }));

    services.inventoryItemRepository.seedProductVariant(
      TEST_STORE_A_ID,
      TEST_VARIANT_A_ID,
    );
    services.variantSnapshotReader.seedVariant({
      storeId: TEST_STORE_A_ID,
      productVariantId: TEST_VARIANT_A_ID,
      productName: "Classic Tee",
      sku: "TEE-001",
      unitPrice: "19.99",
      currency: "USD",
      isActive: true,
    });

    await services.inventoryService.createInventoryItem({
      storeId: TEST_STORE_A_ID,
      warehouseId: warehouse.id,
      productVariantId: TEST_VARIANT_A_ID,
      initialQuantity: 10,
    });

    const draft = await services.orderService.createOrder({
      storeId: TEST_STORE_A_ID,
      status: "draft",
      items: [{ productVariantId: TEST_VARIANT_A_ID, quantity: 2 }],
    });

    await expect(
      services.reservationService.reserveOrder(
        { storeId: TEST_STORE_A_ID },
        draft.id,
      ),
    ).rejects.toMatchObject({
      code: RESERVATION_ERROR_CODES.ORDER_NOT_CONFIRMED,
      status: 409,
    });
  });

  it("rejects repeated reservation for the same order", async () => {
    const services = createMemoryReservationService();
    const { confirmed } = await seedConfirmedOrderWithInventory(services);

    await services.reservationService.reserveOrder(
      { storeId: TEST_STORE_A_ID },
      confirmed.id,
    );

    await expect(
      services.reservationService.reserveOrder(
        { storeId: TEST_STORE_A_ID },
        confirmed.id,
      ),
    ).rejects.toMatchObject({
      code: RESERVATION_ERROR_CODES.ALREADY_RESERVED,
      status: 409,
    });
  });

  it("isolates reservation actions by store", async () => {
    const services = createMemoryReservationService();
    const { confirmed } = await seedConfirmedOrderWithInventory(services);

    await expect(
      services.reservationService.reserveOrder(
        { storeId: TEST_STORE_B_ID },
        confirmed.id,
      ),
    ).rejects.toMatchObject({
      code: RESERVATION_ERROR_CODES.ORDER_NOT_FOUND,
      status: 404,
    });
  });

  it("lists reservations for an order", async () => {
    const services = createMemoryReservationService();
    const { confirmed } = await seedConfirmedOrderWithInventory(services);

    await services.reservationService.reserveOrder(
      { storeId: TEST_STORE_A_ID },
      confirmed.id,
    );

    const reservations = await services.reservationService.listOrderReservations(
      { storeId: TEST_STORE_A_ID },
      confirmed.id,
    );

    expect(reservations).toHaveLength(1);
    expect(reservations[0]?.orderId).toBe(confirmed.id);
  });

  it("does not persist reservations when creation fails mid-transaction", async () => {
    const services = createMemoryReservationService();
    const { confirmed } = await seedConfirmedOrderWithInventory(services);

    services.reservationRepository.setTransactionFailure(
      new Error("simulated reservation failure"),
    );

    await expect(
      services.reservationService.reserveOrder(
        { storeId: TEST_STORE_A_ID },
        confirmed.id,
      ),
    ).rejects.toThrow("simulated reservation failure");

    expect(services.reservationRepository.getReservationCount()).toBe(0);
  });

  it("reports available stock as on-hand minus active reservations", async () => {
    const services = createMemoryReservationService();
    const { inventoryItem, confirmed } =
      await seedConfirmedOrderWithInventory(services, {
        initialQuantity: 10,
        orderQuantity: 4,
      });

    expect(
      await services.reservationService.getAvailableQuantity(
        TEST_STORE_A_ID,
        inventoryItem.id,
      ),
    ).toBe(10);

    await services.reservationService.reserveOrder(
      { storeId: TEST_STORE_A_ID },
      confirmed.id,
    );

    expect(
      await services.reservationService.getAvailableQuantity(
        TEST_STORE_A_ID,
        inventoryItem.id,
      ),
    ).toBe(6);
  });
});
