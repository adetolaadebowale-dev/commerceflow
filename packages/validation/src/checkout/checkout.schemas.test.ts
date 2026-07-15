import { describe, expect, it } from "vitest";

import { checkoutCartSchema } from "./checkout.schemas";

describe("checkout schemas", () => {
  it("validates checkout cart input", () => {
    const parsed = checkoutCartSchema.safeParse({
      customerAddressId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      shippingMethodId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects checkout without customer address id", () => {
    const parsed = checkoutCartSchema.safeParse({
      shippingMethodId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects checkout without shipping method id", () => {
    const parsed = checkoutCartSchema.safeParse({
      customerAddressId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    });

    expect(parsed.success).toBe(false);
  });
});
