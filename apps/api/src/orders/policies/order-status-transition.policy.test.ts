import { describe, expect, it } from "vitest";

import { OrderStatusTransitionPolicy } from "./order-status-transition.policy";

describe("OrderStatusTransitionPolicy", () => {
  it("allows draft to confirmed and cancelled", () => {
    expect(OrderStatusTransitionPolicy.canTransition("draft", "confirmed")).toBe(
      true,
    );
    expect(OrderStatusTransitionPolicy.canTransition("draft", "cancelled")).toBe(
      true,
    );
  });

  it("allows confirmed to cancelled only", () => {
    expect(
      OrderStatusTransitionPolicy.canTransition("confirmed", "cancelled"),
    ).toBe(true);
    expect(
      OrderStatusTransitionPolicy.canTransition("confirmed", "fulfilled"),
    ).toBe(true);
    expect(
      OrderStatusTransitionPolicy.canTransition("confirmed", "confirmed"),
    ).toBe(false);
    expect(
      OrderStatusTransitionPolicy.canTransition("confirmed", "draft"),
    ).toBe(false);
  });

  it("treats cancelled and fulfilled as terminal", () => {
    expect(OrderStatusTransitionPolicy.allowedTargets("cancelled")).toEqual([]);
    expect(OrderStatusTransitionPolicy.allowedTargets("fulfilled")).toEqual([]);
    expect(
      OrderStatusTransitionPolicy.canTransition("fulfilled", "confirmed"),
    ).toBe(false);
  });
});
