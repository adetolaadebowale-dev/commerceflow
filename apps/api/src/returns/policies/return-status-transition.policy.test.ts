import { describe, expect, it } from "vitest";

import { ReturnStatusTransitionPolicy } from "./return-status-transition.policy";

describe("ReturnStatusTransitionPolicy", () => {
  it("allows the warehouse return lifecycle", () => {
    expect(ReturnStatusTransitionPolicy.canTransition("requested", "received")).toBe(
      true,
    );
    expect(ReturnStatusTransitionPolicy.canTransition("received", "inspecting")).toBe(
      true,
    );
    expect(ReturnStatusTransitionPolicy.canTransition("inspecting", "completed")).toBe(
      true,
    );
    expect(ReturnStatusTransitionPolicy.canTransition("inspecting", "rejected")).toBe(
      true,
    );
  });

  it("treats completed and rejected as terminal", () => {
    expect(ReturnStatusTransitionPolicy.isTerminal("completed")).toBe(true);
    expect(ReturnStatusTransitionPolicy.isTerminal("rejected")).toBe(true);
    expect(ReturnStatusTransitionPolicy.isTerminal("requested")).toBe(false);
  });
});
