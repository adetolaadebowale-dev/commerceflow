import { describe, expect, it } from "vitest";

import { PaymentStatusTransitionPolicy } from "./payment-status-transition.policy";

describe("PaymentStatusTransitionPolicy", () => {
  it("allows pending to authorize, fail, or cancel", () => {
    expect(PaymentStatusTransitionPolicy.canTransition("pending", "authorized")).toBe(
      true,
    );
    expect(PaymentStatusTransitionPolicy.canTransition("pending", "failed")).toBe(
      true,
    );
    expect(PaymentStatusTransitionPolicy.canTransition("pending", "cancelled")).toBe(
      true,
    );
  });

  it("allows authorized to mark paid, fail, or cancel", () => {
    expect(PaymentStatusTransitionPolicy.canTransition("authorized", "paid")).toBe(
      true,
    );
    expect(PaymentStatusTransitionPolicy.canTransition("authorized", "failed")).toBe(
      true,
    );
    expect(PaymentStatusTransitionPolicy.canTransition("authorized", "cancelled")).toBe(
      true,
    );
  });

  it("rejects invalid transitions from terminal states", () => {
    expect(PaymentStatusTransitionPolicy.canTransition("paid", "pending")).toBe(
      false,
    );
    expect(PaymentStatusTransitionPolicy.canTransition("failed", "paid")).toBe(
      false,
    );
    expect(PaymentStatusTransitionPolicy.canTransition("cancelled", "authorized")).toBe(
      false,
    );
  });

  it("rejects skipping authorization", () => {
    expect(PaymentStatusTransitionPolicy.canTransition("pending", "paid")).toBe(
      false,
    );
  });
});
