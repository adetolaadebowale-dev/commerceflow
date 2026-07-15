import { describe, expect, it } from "vitest";

import {
  createShipmentPackageSchema,
  updateShipmentPackageSchema,
} from "./shipment-package.schemas";

describe("shipment package schemas", () => {
  it("validates create package input", () => {
    const parsed = createShipmentPackageSchema.safeParse({
      weight: "2.5",
      weightUnit: "kg",
      length: "30",
      width: "20",
      height: "10",
      dimensionUnit: "cm",
      trackingNumber: "TRACK-001",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects non-positive weight and dimensions", () => {
    const parsed = createShipmentPackageSchema.safeParse({
      weight: "0",
      weightUnit: "kg",
      length: "30",
      width: "20",
      height: "10",
      dimensionUnit: "cm",
    });

    expect(parsed.success).toBe(false);
  });

  it("validates update package input", () => {
    const parsed = updateShipmentPackageSchema.safeParse({
      weight: "3.0",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects empty update package input", () => {
    const parsed = updateShipmentPackageSchema.safeParse({});

    expect(parsed.success).toBe(false);
  });
});
