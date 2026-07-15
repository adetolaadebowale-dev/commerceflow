import { describe, expect, it } from "vitest";

import { InvoiceStatusTransitionPolicy } from "./invoice-status-transition.policy";

describe("InvoiceStatusTransitionPolicy", () => {
  it("allows draft to issue or void", () => {
    expect(InvoiceStatusTransitionPolicy.canTransition("draft", "issued")).toBe(
      true,
    );
    expect(InvoiceStatusTransitionPolicy.canTransition("draft", "void")).toBe(
      true,
    );
  });

  it("allows issued to mark paid or void", () => {
    expect(InvoiceStatusTransitionPolicy.canTransition("issued", "paid")).toBe(
      true,
    );
    expect(InvoiceStatusTransitionPolicy.canTransition("issued", "void")).toBe(
      true,
    );
  });

  it("rejects invalid transitions", () => {
    expect(InvoiceStatusTransitionPolicy.canTransition("draft", "paid")).toBe(
      false,
    );
    expect(InvoiceStatusTransitionPolicy.canTransition("paid", "issued")).toBe(
      false,
    );
    expect(InvoiceStatusTransitionPolicy.canTransition("void", "draft")).toBe(
      false,
    );
  });
});
