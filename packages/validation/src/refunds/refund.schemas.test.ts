import { describe, expect, it } from "vitest";

import { createRefundSchema } from "./refund.schemas";

describe("refund.schemas", () => {
  it("accepts valid create refund input", () => {
    const result = createRefundSchema.safeParse({
      reason: "Customer returned item",
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty reason", () => {
    const result = createRefundSchema.safeParse({ reason: "   " });

    expect(result.success).toBe(false);
  });

  it("rejects missing reason", () => {
    const result = createRefundSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});
