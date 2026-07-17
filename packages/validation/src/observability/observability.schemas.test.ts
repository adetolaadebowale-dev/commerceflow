import { describe, expect, it } from "vitest";

import { observabilityStoreQuerySchema } from "./observability.schemas";

describe("observability schemas", () => {
  const validUuid = "11111111-1111-1111-1111-111111111111";

  it("accepts store-scoped queries", () => {
    expect(
      observabilityStoreQuerySchema.parse({ storeId: validUuid }),
    ).toEqual({ storeId: validUuid });
  });

  it("rejects invalid store ids", () => {
    expect(() =>
      observabilityStoreQuerySchema.parse({ storeId: "not-a-uuid" }),
    ).toThrow();
  });
});
