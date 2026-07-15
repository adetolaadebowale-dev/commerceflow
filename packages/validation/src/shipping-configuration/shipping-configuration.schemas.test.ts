import { describe, expect, it } from "vitest";

import {
  createShippingMethodSchema,
  createShippingZoneSchema,
  updateShippingMethodSchema,
  updateShippingZoneSchema,
} from "./shipping-configuration.schemas";

describe("shipping configuration schemas", () => {
  const storeId = "11111111-1111-1111-1111-111111111111";
  const shippingZoneId = "33333333-3333-3333-3333-333333333333";

  it("accepts valid shipping zone input and normalizes country codes", () => {
    const parsed = createShippingZoneSchema.safeParse({
      storeId,
      name: "North America",
      countries: ["us", "ca"],
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.countries).toEqual(["US", "CA"]);
      expect(parsed.data.status).toBe("inactive");
    }
  });

  it("rejects duplicate country codes within a zone", () => {
    const parsed = createShippingZoneSchema.safeParse({
      storeId,
      name: "Europe",
      countries: ["DE", "de"],
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects shipping zone update with no fields", () => {
    const parsed = updateShippingZoneSchema.safeParse({});
    expect(parsed.success).toBe(false);
  });

  it("accepts valid shipping method input", () => {
    const parsed = createShippingMethodSchema.safeParse({
      storeId,
      shippingZoneId,
      name: "Standard",
      carrier: "internal",
      flatRate: "9.99",
      currency: "usd",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.currency).toBe("USD");
      expect(parsed.data.status).toBe("inactive");
    }
  });

  it("rejects negative flat rates", () => {
    const parsed = createShippingMethodSchema.safeParse({
      storeId,
      shippingZoneId,
      name: "Standard",
      carrier: "manual",
      flatRate: "-1.00",
      currency: "USD",
    });

    expect(parsed.success).toBe(false);
  });

  it("allows zero flat rate", () => {
    const parsed = createShippingMethodSchema.safeParse({
      storeId,
      shippingZoneId,
      name: "Free",
      carrier: "internal",
      flatRate: "0",
      currency: "USD",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects shipping method update with no fields", () => {
    const parsed = updateShippingMethodSchema.safeParse({});
    expect(parsed.success).toBe(false);
  });
});
