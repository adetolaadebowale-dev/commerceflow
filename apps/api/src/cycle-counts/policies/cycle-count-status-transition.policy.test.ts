import { describe, expect, it } from "vitest";

import { CycleCountStatusTransitionPolicy } from "../policies/cycle-count-status-transition.policy";

describe("CycleCountStatusTransitionPolicy", () => {
  it("marks completed and approved as immutable", () => {
    expect(CycleCountStatusTransitionPolicy.isImmutable("completed")).toBe(true);
    expect(CycleCountStatusTransitionPolicy.isImmutable("approved")).toBe(true);
    expect(CycleCountStatusTransitionPolicy.isImmutable("draft")).toBe(false);
  });
});
