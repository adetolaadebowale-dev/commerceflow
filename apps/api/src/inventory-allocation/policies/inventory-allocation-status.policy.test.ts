import { describe, expect, it } from "vitest";

import { InventoryAllocationStatusPolicy } from "../policies/inventory-allocation-status.policy";

describe("InventoryAllocationStatusPolicy", () => {
  it("derives allocation lifecycle statuses", () => {
    expect(InventoryAllocationStatusPolicy.deriveStatus(5, 0)).toBe("allocated");
    expect(InventoryAllocationStatusPolicy.deriveStatus(5, 2)).toBe(
      "partially_picked",
    );
    expect(InventoryAllocationStatusPolicy.deriveStatus(5, 5)).toBe("picked");
  });

  it("calculates remaining inventory holds", () => {
    expect(
      InventoryAllocationStatusPolicy.remainingHold(5, 0, "allocated"),
    ).toBe(5);
    expect(
      InventoryAllocationStatusPolicy.remainingHold(5, 2, "partially_picked"),
    ).toBe(3);
    expect(
      InventoryAllocationStatusPolicy.remainingHold(5, 5, "picked"),
    ).toBe(0);
    expect(
      InventoryAllocationStatusPolicy.remainingHold(5, 1, "shortage"),
    ).toBe(0);
  });
});
