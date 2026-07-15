import { describe, expect, it } from "vitest";

import { ShipmentStatusTransitionPolicy } from "./shipment-status-transition.policy";

describe("ShipmentStatusTransitionPolicy", () => {
  it("allows pending to move to packed or cancelled", () => {
    expect(ShipmentStatusTransitionPolicy.allowedTargets("pending")).toEqual([
      "packed",
      "cancelled",
    ]);
    expect(
      ShipmentStatusTransitionPolicy.canTransition("pending", "packed"),
    ).toBe(true);
    expect(
      ShipmentStatusTransitionPolicy.canTransition("pending", "cancelled"),
    ).toBe(true);
  });

  it("allows packed to move to shipped or cancelled", () => {
    expect(ShipmentStatusTransitionPolicy.allowedTargets("packed")).toEqual([
      "shipped",
      "cancelled",
    ]);
    expect(
      ShipmentStatusTransitionPolicy.canTransition("packed", "shipped"),
    ).toBe(true);
  });

  it("allows shipped to move to delivered only", () => {
    expect(ShipmentStatusTransitionPolicy.allowedTargets("shipped")).toEqual([
      "delivered",
    ]);
    expect(
      ShipmentStatusTransitionPolicy.canTransition("shipped", "delivered"),
    ).toBe(true);
  });

  it("treats delivered and cancelled as terminal", () => {
    expect(ShipmentStatusTransitionPolicy.allowedTargets("delivered")).toEqual([]);
    expect(ShipmentStatusTransitionPolicy.allowedTargets("cancelled")).toEqual([]);
    expect(
      ShipmentStatusTransitionPolicy.canTransition("delivered", "shipped"),
    ).toBe(false);
    expect(
      ShipmentStatusTransitionPolicy.canTransition("cancelled", "pending"),
    ).toBe(false);
  });

  it("rejects skipping packed when shipping from pending", () => {
    expect(
      ShipmentStatusTransitionPolicy.canTransition("pending", "shipped"),
    ).toBe(false);
  });
});
