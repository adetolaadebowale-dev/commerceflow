import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryShipmentModule,
  createPackedShipment,
  createPendingShipment,
  TEST_STORE_A_ID,
} from "../testing/shipment-test-utils";

describe("ShipmentService domain events", () => {
  it("emits shipment.created after successful creation", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("shipment.created", handler);

    const module = createMemoryShipmentModule({ domainEventPublisher: publisher });
    const { shipment } = await createPendingShipment(module);

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "shipment.created",
      aggregateId: shipment.id,
      storeId: TEST_STORE_A_ID,
    });
  });

  it("emits shipment.shipped, shipment.delivered, and shipment.cancelled", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const shippedHandler = vi.fn();
    const deliveredHandler = vi.fn();
    const cancelledHandler = vi.fn();
    dispatcher.subscribe("shipment.shipped", shippedHandler);
    dispatcher.subscribe("shipment.delivered", deliveredHandler);
    dispatcher.subscribe("shipment.cancelled", cancelledHandler);

    const module = createMemoryShipmentModule({ domainEventPublisher: publisher });
    const { shipment: pending } = await createPendingShipment(module);

    const packed = await module.shipmentService.packShipment(
      { storeId: TEST_STORE_A_ID },
      pending.id,
    );
    const shipped = await module.shipmentService.shipShipment(
      { storeId: TEST_STORE_A_ID },
      packed.id,
    );
    await module.shipmentService.deliverShipment(
      { storeId: TEST_STORE_A_ID },
      shipped.id,
    );

    const cancelModule = createMemoryShipmentModule({
      domainEventPublisher: publisher,
    });
    const { shipment: cancellable } = await createPackedShipment(cancelModule);
    await cancelModule.shipmentService.cancelShipment(
      { storeId: TEST_STORE_A_ID },
      cancellable.id,
    );

    await vi.waitFor(() => {
      expect(shippedHandler).toHaveBeenCalledOnce();
      expect(deliveredHandler).toHaveBeenCalledOnce();
      expect(cancelledHandler).toHaveBeenCalledOnce();
    });
  });

  it("does not emit lifecycle events when transition fails", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("shipment.delivered", handler);

    const module = createMemoryShipmentModule({ domainEventPublisher: publisher });
    const { shipment } = await createPendingShipment(module);

    await expect(
      module.shipmentService.deliverShipment(
        { storeId: TEST_STORE_A_ID },
        shipment.id,
      ),
    ).rejects.toBeTruthy();

    expect(handler).not.toHaveBeenCalled();
  });
});
