import { describe, expect, it } from "vitest";

import { applyCartPromotionSchema } from "./promotion-redemption.schemas";

describe("applyCartPromotionSchema", () => {
  it("accepts a valid promotion code", () => {
    const parsed = applyCartPromotionSchema.parse({ code: "SAVE20" });
    expect(parsed.code).toBe("SAVE20");
  });

  it("rejects empty codes", () => {
    const result = applyCartPromotionSchema.safeParse({ code: "   " });
    expect(result.success).toBe(false);
  });
});
