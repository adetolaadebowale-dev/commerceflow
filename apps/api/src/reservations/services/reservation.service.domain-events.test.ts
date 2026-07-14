import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryReservationService,
  seedConfirmedOrderWithInventory,
  TEST_STORE_A_ID,
} from "../testing/reservation-test-utils";
import { ReservationService } from "./reservation.service";

describe("ReservationService domain events", () => {
  it("emits inventory.reserved after successful reservation", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("inventory.reserved", handler);

    const services = createMemoryReservationService();
    const reservationService = new ReservationService({
      inventoryReservationRepository: services.reservationRepository,
      orderRepository: services.orderRepository,
      inventoryItemRepository: services.inventoryItemRepository,
      domainEventPublisher: publisher,
    });
    const { confirmed } = await seedConfirmedOrderWithInventory(services);

    await reservationService.reserveOrder(
      { storeId: TEST_STORE_A_ID },
      confirmed.id,
    );

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "inventory.reserved",
      aggregateId: confirmed.id,
      payload: {
        orderId: confirmed.id,
        reservationCount: 1,
      },
    });
  });

  it("emits inventory.released after successful release", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("inventory.released", handler);

    const services = createMemoryReservationService();
    const reservationService = new ReservationService({
      inventoryReservationRepository: services.reservationRepository,
      orderRepository: services.orderRepository,
      inventoryItemRepository: services.inventoryItemRepository,
      domainEventPublisher: publisher,
    });
    const { confirmed } = await seedConfirmedOrderWithInventory(services);
    const [reservation] = await reservationService.reserveOrder(
      { storeId: TEST_STORE_A_ID },
      confirmed.id,
    );

    await reservationService.releaseReservation(
      { storeId: TEST_STORE_A_ID },
      reservation.id,
    );

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "inventory.released",
      aggregateId: reservation.id,
      payload: {
        reservationId: reservation.id,
        orderId: confirmed.id,
      },
    });
  });
});
