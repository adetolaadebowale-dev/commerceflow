import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryShipmentTrackingModule,
  createSampleTrackingEvent,
  TEST_STORE_A_ID,
} from "../testing/shipment-tracking-test-utils";

describe("ShipmentTrackingService domain events", () => {
  it("emits shipment.tracking.updated after creating a tracking event", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("shipment.tracking.updated", handler);

    const module = createMemoryShipmentTrackingModule({
      domainEventPublisher: publisher,
    });
    const { shipment, trackingEvent } = await createSampleTrackingEvent(module);

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "shipment.tracking.updated",
      aggregateId: shipment.id,
      storeId: TEST_STORE_A_ID,
      payload: {
        shipmentId: shipment.id,
        trackingEvent: expect.objectContaining({
          id: trackingEvent.id,
          eventType: trackingEvent.eventType,
        }),
      },
    });
  });

  it("does not emit events when shipment lookup fails", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("shipment.tracking.updated", handler);

    const module = createMemoryShipmentTrackingModule({
      domainEventPublisher: publisher,
    });

    await expect(
      module.shipmentTrackingService.createTrackingEvent(
        TEST_STORE_A_ID,
        "99999999-9999-9999-9999-999999999999",
        {
          eventType: "note",
          description: "Should not emit",
        },
      ),
    ).rejects.toBeTruthy();

    expect(handler).not.toHaveBeenCalled();
  });
});
