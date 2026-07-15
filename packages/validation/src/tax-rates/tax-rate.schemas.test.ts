import { describe, expect, it } from "vitest";

import { createTaxRateSchema } from "./tax-rate.schemas";

describe("tax rate schemas", () => {
  it("accepts valid tax rate input", () => {
    const parsed = createTaxRateSchema.safeParse({
      storeId: "11111111-1111-1111-1111-111111111111",
      name: "Standard Sales Tax",
      percentage: "8.25",
      status: "inactive",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects percentages outside 0 to 100", () => {
    const parsed = createTaxRateSchema.safeParse({
      storeId: "11111111-1111-1111-1111-111111111111",
      name: "Invalid Tax",
      percentage: "150",
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts boundary percentages", () => {
    expect(
      createTaxRateSchema.safeParse({
        storeId: "11111111-1111-1111-1111-111111111111",
        name: "Zero Tax",
        percentage: "0",
      }).success,
    ).toBe(true);

    expect(
      createTaxRateSchema.safeParse({
        storeId: "11111111-1111-1111-1111-111111111111",
        name: "Full Tax",
        percentage: "100",
      }).success,
    ).toBe(true);
  });
});
