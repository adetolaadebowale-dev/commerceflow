import { describe, expect, it } from "vitest";

import {
  customerCreateFormSchema,
  toCreatePayload,
} from "@/features/customers/customer-form-schema";

describe("customer-form-schema", () => {
  it("accepts a valid create payload and strips empty phone", () => {
    const parsed = customerCreateFormSchema.parse({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      phone: "  ",
      status: "active",
    });

    expect(toCreatePayload(parsed)).toEqual({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      phone: undefined,
      status: "active",
    });
  });

  it("rejects an invalid email", () => {
    const parsed = customerCreateFormSchema.safeParse({
      firstName: "Jane",
      lastName: "Doe",
      email: "not-an-email",
      phone: "",
      status: "active",
    });

    expect(parsed.success).toBe(false);
  });
});
