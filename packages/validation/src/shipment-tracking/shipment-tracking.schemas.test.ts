import { describe, expect, it } from "vitest";

import {
  createShipmentTrackingEventSchema,
  shipmentTrackingQuerySchema,
} from "./shipment-tracking.schemas";

const STORE_ID = "11111111-1111-1111-1111-111111111111";

describe("shipment-tracking.schemas", () => {
  it("accepts valid create tracking event input", () => {
    const result = createShipmentTrackingEventSchema.safeParse({
      eventType: "location_update",
      description: "Arrived at regional hub",
      location: "Chicago, IL",
    });
    expect(result.success).toBe(true);
  });

  it("accepts create tracking event input without optional fields", () => {
    const result = createShipmentTrackingEventSchema.safeParse({
      eventType: "note",
      description: "Customer requested evening delivery",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid event type", () => {
    const result = createShipmentTrackingEventSchema.safeParse({
      eventType: "invalid",
      description: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty description", () => {
    const result = createShipmentTrackingEventSchema.safeParse({
      eventType: "note",
      description: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("validates shipment tracking query", () => {
    const result = shipmentTrackingQuerySchema.safeParse({ storeId: STORE_ID });
    expect(result.success).toBe(true);
  });
});
