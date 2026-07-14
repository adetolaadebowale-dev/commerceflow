import { describe, expect, it } from "vitest";

import {
  createCustomerAddressSchema,
  updateCustomerAddressSchema,
} from "./customer-address.schemas";

describe("customer address schemas", () => {
  it("validates customer address creation input", () => {
    const parsed = createCustomerAddressSchema.safeParse({
      label: "Home",
      recipientName: "Jane Doe",
      addressLine1: "123 Main St",
      city: "Springfield",
      stateProvince: "IL",
      postalCode: "62704",
      countryCode: "us",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.countryCode).toBe("US");
    }
  });

  it("rejects customer address creation without required fields", () => {
    const parsed = createCustomerAddressSchema.safeParse({
      label: "Home",
    });

    expect(parsed.success).toBe(false);
  });

  it("validates partial customer address updates", () => {
    const parsed = updateCustomerAddressSchema.safeParse({
      isDefault: true,
    });

    expect(parsed.success).toBe(true);
  });
});
