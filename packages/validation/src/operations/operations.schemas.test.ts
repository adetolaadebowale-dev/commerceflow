import { describe, expect, it } from "vitest";

import { operationsStoreQuerySchema } from "@commerceflow/validation";

describe("operationsStoreQuerySchema", () => {
  it("accepts a valid store id", () => {
    const parsed = operationsStoreQuerySchema.safeParse({
      storeId: "11111111-1111-1111-1111-111111111111",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects an invalid store id", () => {
    const parsed = operationsStoreQuerySchema.safeParse({
      storeId: "not-a-uuid",
    });

    expect(parsed.success).toBe(false);
  });
});
