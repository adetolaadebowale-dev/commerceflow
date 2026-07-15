import { describe, expect, it } from "vitest";

import {
  createSupplierSchema,
  updateSupplierContactSchema,
  updateSupplierSchema,
} from "./supplier.schemas";

describe("supplier schemas", () => {
  it("accepts valid supplier input", () => {
    const parsed = createSupplierSchema.safeParse({
      storeId: "11111111-1111-1111-1111-111111111111",
      code: "ACME",
      name: "Acme Supplies",
      currency: "usd",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.currency).toBe("USD");
      expect(parsed.data.paymentTerm).toBe("net30");
      expect(parsed.data.status).toBe("active");
    }
  });

  it("rejects invalid supplier codes", () => {
    const parsed = createSupplierSchema.safeParse({
      storeId: "11111111-1111-1111-1111-111111111111",
      code: "acme",
      name: "Acme Supplies",
    });

    expect(parsed.success).toBe(false);
  });

  it("requires at least one field on supplier update", () => {
    const parsed = updateSupplierSchema.safeParse({});

    expect(parsed.success).toBe(false);
  });

  it("requires at least one field on contact update", () => {
    const parsed = updateSupplierContactSchema.safeParse({
      storeId: "11111111-1111-1111-1111-111111111111",
    });

    expect(parsed.success).toBe(false);
  });
});
