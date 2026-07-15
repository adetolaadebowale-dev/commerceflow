import { describe, expect, it } from "vitest";

import { createPaymentSchema } from "./payment.schemas";

describe("payment.schemas", () => {
  it("accepts valid create payment input", () => {
    const result = createPaymentSchema.safeParse({
      provider: "internal",
      metadata: { note: "manual entry" },
    });

    expect(result.success).toBe(true);
  });

  it("defaults provider to internal", () => {
    const result = createPaymentSchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.provider).toBe("internal");
    }
  });

  it("rejects invalid provider", () => {
    const result = createPaymentSchema.safeParse({ provider: "stripe" });

    expect(result.success).toBe(false);
  });
});
