import { describe, expect, it } from "vitest";

import { SHIPMENT_TRACKING_ERROR_CODES } from "../errors";
import {
  createMemoryShipmentTrackingModule,
  createSampleTrackingEvent,
  seedPendingShipmentWithTracking,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  validTrackingEventInput,
} from "../testing/shipment-tracking-test-utils";

describe("ShipmentTrackingService", () => {
  it("creates an append-only tracking event with status snapshot", async () => {
    const module = createMemoryShipmentTrackingModule();
    const { shipment } = await seedPendingShipmentWithTracking(module);

    const trackingEvent =
      await module.shipmentTrackingService.createTrackingEvent(
        TEST_STORE_A_ID,
        shipment.id,
        validTrackingEventInput({
          eventType: "carrier_update",
          description: "Carrier accepted package",
        }),
      );

    expect(trackingEvent.shipmentId).toBe(shipment.id);
    expect(trackingEvent.storeId).toBe(TEST_STORE_A_ID);
    expect(trackingEvent.statusSnapshot).toBe("pending");
    expect(trackingEvent.eventType).toBe("carrier_update");
    expect(trackingEvent.description).toBe("Carrier accepted package");
    expect(trackingEvent.location).toBe("Chicago, IL");
  });

  it("does not modify shipment lifecycle when creating tracking events", async () => {
    const module = createMemoryShipmentTrackingModule();
    const { shipment } = await seedPendingShipmentWithTracking(module);

    await module.shipmentTrackingService.createTrackingEvent(
      TEST_STORE_A_ID,
      shipment.id,
      validTrackingEventInput(),
    );

    const unchanged = await module.shipmentService.getShipment(
      TEST_STORE_A_ID,
      shipment.id,
    );
    expect(unchanged.status).toBe("pending");
  });

  it("lists tracking events oldest to newest", async () => {
    const module = createMemoryShipmentTrackingModule();
    const { shipment } = await seedPendingShipmentWithTracking(module);

    await module.shipmentTrackingService.createTrackingEvent(
      TEST_STORE_A_ID,
      shipment.id,
      validTrackingEventInput({
        description: "First event",
        location: "Origin facility",
      }),
    );

    await module.shipmentService.packShipment(
      { storeId: TEST_STORE_A_ID },
      shipment.id,
    );

    await module.shipmentTrackingService.createTrackingEvent(
      TEST_STORE_A_ID,
      shipment.id,
      validTrackingEventInput({
        eventType: "status_update",
        description: "Packed for dispatch",
      }),
    );

    const trackingEvents =
      await module.shipmentTrackingService.listTrackingEvents(
        { storeId: TEST_STORE_A_ID },
        shipment.id,
      );

    expect(trackingEvents).toHaveLength(2);
    expect(trackingEvents[0]?.description).toBe("First event");
    expect(trackingEvents[0]?.statusSnapshot).toBe("pending");
    expect(trackingEvents[1]?.description).toBe("Packed for dispatch");
    expect(trackingEvents[1]?.statusSnapshot).toBe("packed");
  });

  it("rejects tracking events for missing shipments", async () => {
    const module = createMemoryShipmentTrackingModule();

    await expect(
      module.shipmentTrackingService.createTrackingEvent(
        TEST_STORE_A_ID,
        "99999999-9999-9999-9999-999999999999",
        validTrackingEventInput(),
      ),
    ).rejects.toMatchObject({
      code: SHIPMENT_TRACKING_ERROR_CODES.SHIPMENT_NOT_FOUND,
      status: 404,
    });
  });

  it("scopes tracking events by store", async () => {
    const module = createMemoryShipmentTrackingModule();
    const { shipment } = await createSampleTrackingEvent(module);

    await expect(
      module.shipmentTrackingService.listTrackingEvents(
        { storeId: TEST_STORE_B_ID },
        shipment.id,
      ),
    ).rejects.toMatchObject({
      code: SHIPMENT_TRACKING_ERROR_CODES.SHIPMENT_NOT_FOUND,
      status: 404,
    });
  });
});
