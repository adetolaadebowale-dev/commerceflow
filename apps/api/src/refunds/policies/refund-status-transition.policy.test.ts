import { describe, expect, it } from "vitest";

import { RefundStatusTransitionPolicy } from "./refund-status-transition.policy";

describe("RefundStatusTransitionPolicy", () => {
  it("allows pending to complete or cancel", () => {
    expect(RefundStatusTransitionPolicy.canTransition("pending", "completed")).toBe(
      true,
    );
    expect(RefundStatusTransitionPolicy.canTransition("pending", "cancelled")).toBe(
      true,
    );
  });

  it("rejects transitions from terminal states", () => {
    expect(RefundStatusTransitionPolicy.canTransition("completed", "pending")).toBe(
      false,
    );
    expect(RefundStatusTransitionPolicy.canTransition("cancelled", "completed")).toBe(
      false,
    );
  });
});
