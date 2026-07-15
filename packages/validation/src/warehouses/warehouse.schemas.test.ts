import { describe, expect, it } from "vitest";

import { createWarehouseSchema, updateWarehouseSchema } from "./warehouse.schemas";

describe("warehouse schemas", () => {
  it("accepts valid warehouse input", () => {
    const parsed = createWarehouseSchema.safeParse({
      storeId: "11111111-1111-1111-1111-111111111111",
      name: "Main Warehouse",
      code: "MAIN",
      address: "123 Industrial Pkwy",
      city: "Austin",
      stateProvince: "TX",
      postalCode: "78701",
      countryCode: "us",
      status: "active",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.countryCode).toBe("US");
    }
  });

  it("rejects invalid warehouse codes", () => {
    const parsed = createWarehouseSchema.safeParse({
      storeId: "11111111-1111-1111-1111-111111111111",
      name: "Invalid Warehouse",
      code: "main",
      address: "123 Industrial Pkwy",
      city: "Austin",
      stateProvince: "TX",
      postalCode: "78701",
      countryCode: "US",
    });

    expect(parsed.success).toBe(false);
  });

  it("requires at least one field on update", () => {
    const parsed = updateWarehouseSchema.safeParse({});

    expect(parsed.success).toBe(false);
  });
});
