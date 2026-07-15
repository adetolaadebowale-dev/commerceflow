import { describe, expect, it } from "vitest";

import { PickListStatusTransitionPolicy } from "./pick-list-status-transition.policy";

describe("PickListStatusTransitionPolicy", () => {
  it("allows pending to picking to picked to packed", () => {
    expect(
      PickListStatusTransitionPolicy.canTransition("pending", "picking"),
    ).toBe(true);
    expect(
      PickListStatusTransitionPolicy.canTransition("picking", "picked"),
    ).toBe(true);
    expect(
      PickListStatusTransitionPolicy.canTransition("picked", "packed"),
    ).toBe(true);
  });

  it("treats packed as terminal", () => {
    expect(PickListStatusTransitionPolicy.isActive("packed")).toBe(false);
    expect(PickListStatusTransitionPolicy.isActive("picking")).toBe(true);
  });
});
