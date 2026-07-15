import { describe, expect, it } from "vitest";

import { PurchaseOrderStatusTransitionPolicy } from "../policies/purchase-order-status-transition.policy";

describe("PurchaseOrderStatusTransitionPolicy", () => {
  it("allows draft → approved → ordered → partially_received → received", () => {
    expect(
      PurchaseOrderStatusTransitionPolicy.canTransition("draft", "approved"),
    ).toBe(true);
    expect(
      PurchaseOrderStatusTransitionPolicy.canTransition("approved", "ordered"),
    ).toBe(true);
    expect(
      PurchaseOrderStatusTransitionPolicy.canTransition("ordered", "partially_received"),
    ).toBe(true);
    expect(
      PurchaseOrderStatusTransitionPolicy.canTransition("partially_received", "received"),
    ).toBe(true);
  });

  it("allows cancellation from draft and approved only", () => {
    expect(
      PurchaseOrderStatusTransitionPolicy.canTransition("draft", "cancelled"),
    ).toBe(true);
    expect(
      PurchaseOrderStatusTransitionPolicy.canTransition("approved", "cancelled"),
    ).toBe(true);
    expect(
      PurchaseOrderStatusTransitionPolicy.canTransition("ordered", "cancelled"),
    ).toBe(false);
  });
});
