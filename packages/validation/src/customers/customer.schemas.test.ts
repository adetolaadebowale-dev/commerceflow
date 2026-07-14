import { describe, expect, it } from "vitest";

import {
  createCustomerSchema,
  listCustomersQuerySchema,
  updateCustomerSchema,
} from "./customer.schemas";

const TEST_STORE_ID = "11111111-1111-1111-1111-111111111111";

describe("customer schemas", () => {
  it("validates customer creation input", () => {
    const parsed = createCustomerSchema.safeParse({
      storeId: TEST_STORE_ID,
      email: "customer@example.com",
      firstName: "Jane",
      lastName: "Doe",
      phone: "+15551234567",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects customer creation without email", () => {
    const parsed = createCustomerSchema.safeParse({
      storeId: TEST_STORE_ID,
      firstName: "Jane",
      lastName: "Doe",
    });

    expect(parsed.success).toBe(false);
  });

  it("validates partial customer updates", () => {
    const parsed = updateCustomerSchema.safeParse({
      firstName: "Updated",
    });

    expect(parsed.success).toBe(true);
  });

  it("validates customer list query", () => {
    const parsed = listCustomersQuerySchema.safeParse({
      storeId: TEST_STORE_ID,
      page: 1,
      limit: 20,
      status: "active",
    });

    expect(parsed.success).toBe(true);
  });
});
