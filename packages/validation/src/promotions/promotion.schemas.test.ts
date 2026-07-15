import { describe, expect, it } from "vitest";

import {
  createPromotionSchema,
  updatePromotionSchema,
} from "./promotion.schemas";

const validBase = {
  storeId: "11111111-1111-1111-1111-111111111111",
  name: "Summer Sale",
  code: "summer20",
  type: "percentage" as const,
  value: "20",
  startsAt: "2026-07-01T00:00:00.000Z",
  endsAt: "2026-08-01T00:00:00.000Z",
};

describe("createPromotionSchema", () => {
  it("accepts a valid percentage promotion", () => {
    const parsed = createPromotionSchema.parse(validBase);
    expect(parsed.code).toBe("SUMMER20");
    expect(parsed.status).toBe("draft");
  });

  it("accepts a valid fixed amount promotion", () => {
    const parsed = createPromotionSchema.parse({
      ...validBase,
      type: "fixed_amount",
      value: "10.00",
      currency: "usd",
    });

    expect(parsed.currency).toBe("USD");
  });

  it("rejects percentage values above 100", () => {
    const result = createPromotionSchema.safeParse({
      ...validBase,
      value: "101",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid date ranges", () => {
    const result = createPromotionSchema.safeParse({
      ...validBase,
      startsAt: "2026-08-01T00:00:00.000Z",
      endsAt: "2026-07-01T00:00:00.000Z",
    });

    expect(result.success).toBe(false);
  });

  it("rejects currency on percentage promotions", () => {
    const result = createPromotionSchema.safeParse({
      ...validBase,
      currency: "USD",
    });

    expect(result.success).toBe(false);
  });
});

describe("updatePromotionSchema", () => {
  it("accepts partial updates", () => {
    const parsed = updatePromotionSchema.parse({ name: "Updated Sale" });
    expect(parsed.name).toBe("Updated Sale");
  });
});
