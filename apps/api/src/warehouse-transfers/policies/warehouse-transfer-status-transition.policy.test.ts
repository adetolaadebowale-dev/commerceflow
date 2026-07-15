import { describe, expect, it } from "vitest";

import { WarehouseTransferStatusTransitionPolicy } from "../policies/warehouse-transfer-status-transition.policy";

describe("WarehouseTransferStatusTransitionPolicy", () => {
  it("allows draft → approved → in_transit → received", () => {
    expect(
      WarehouseTransferStatusTransitionPolicy.canTransition("draft", "approved"),
    ).toBe(true);
    expect(
      WarehouseTransferStatusTransitionPolicy.canTransition("approved", "in_transit"),
    ).toBe(true);
    expect(
      WarehouseTransferStatusTransitionPolicy.canTransition("in_transit", "received"),
    ).toBe(true);
    expect(WarehouseTransferStatusTransitionPolicy.isTerminal("received")).toBe(
      true,
    );
  });

  it("allows cancellation from draft and approved only", () => {
    expect(
      WarehouseTransferStatusTransitionPolicy.canTransition("draft", "cancelled"),
    ).toBe(true);
    expect(
      WarehouseTransferStatusTransitionPolicy.canTransition(
        "approved",
        "cancelled",
      ),
    ).toBe(true);
    expect(
      WarehouseTransferStatusTransitionPolicy.canTransition(
        "in_transit",
        "cancelled",
      ),
    ).toBe(false);
  });
});
