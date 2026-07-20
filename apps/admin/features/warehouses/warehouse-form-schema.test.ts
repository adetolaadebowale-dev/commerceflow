import { describe, expect, it } from "vitest";

import {
  WAREHOUSE_FORM_DEFAULTS,
  warehouseFormSchema,
} from "@/features/warehouses/warehouse-form-schema";

describe("warehouseFormSchema", () => {
  it("accepts a valid warehouse payload", () => {
    const parsed = warehouseFormSchema.safeParse({
      name: "Main Warehouse",
      code: "MAIN",
      address: "100 Market St",
      city: "Austin",
      stateProvince: "TX",
      postalCode: "78701",
      countryCode: "us",
      status: "active",
      isDefault: true,
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.countryCode).toBe("US");
      expect(parsed.data.isDefault).toBe(true);
    }
  });

  it("rejects lowercase warehouse codes", () => {
    const parsed = warehouseFormSchema.safeParse({
      ...WAREHOUSE_FORM_DEFAULTS,
      name: "East",
      code: "east-1",
      address: "1 Main",
      city: "Austin",
      stateProvince: "TX",
      postalCode: "78701",
    });

    expect(parsed.success).toBe(false);
  });
});
