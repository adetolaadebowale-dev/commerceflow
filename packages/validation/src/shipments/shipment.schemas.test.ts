import { describe, expect, it } from "vitest";

import {
  createShipmentSchema,
  listOrderShipmentsQuerySchema,
  shipmentIdQuerySchema,
} from "./shipment.schemas";

const STORE_ID = "11111111-1111-1111-1111-111111111111";

describe("shipment.schemas", () => {
  it("accepts valid create shipment input", () => {
    const result = createShipmentSchema.safeParse({
      carrier: "internal",
      trackingNumber: "TRACK-123",
    });
    expect(result.success).toBe(true);
  });

  it("accepts create shipment input without tracking number", () => {
    const result = createShipmentSchema.safeParse({ carrier: "manual" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid carrier", () => {
    const result = createShipmentSchema.safeParse({ carrier: "fedex" });
    expect(result.success).toBe(false);
  });

  it("rejects empty tracking number", () => {
    const result = createShipmentSchema.safeParse({
      carrier: "internal",
      trackingNumber: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("validates shipment id query", () => {
    const result = shipmentIdQuerySchema.safeParse({ storeId: STORE_ID });
    expect(result.success).toBe(true);
  });

  it("validates list order shipments query", () => {
    const result = listOrderShipmentsQuerySchema.safeParse({ storeId: STORE_ID });
    expect(result.success).toBe(true);
  });
});
