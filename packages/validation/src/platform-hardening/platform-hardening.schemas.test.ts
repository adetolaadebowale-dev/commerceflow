import { describe, expect, it } from "vitest";

import {
  platformHardeningStoreQuerySchema,
  updateCachePolicySchema,
} from "./platform-hardening.schemas";

describe("platform hardening schemas", () => {
  const validUuid = "11111111-1111-1111-1111-111111111111";

  it("accepts store-scoped queries", () => {
    expect(
      platformHardeningStoreQuerySchema.parse({ storeId: validUuid }),
    ).toEqual({ storeId: validUuid });
  });

  it("accepts cache policy updates", () => {
    const parsed = updateCachePolicySchema.parse({
      storeId: validUuid,
      resource: "catalogue.products",
      enabled: true,
      ttlSeconds: 60,
      description: "Product reads",
    });

    expect(parsed.resource).toBe("catalogue.products");
    expect(parsed.ttlSeconds).toBe(60);
  });

  it("rejects invalid resources and ttl values", () => {
    expect(() =>
      updateCachePolicySchema.parse({
        storeId: validUuid,
        resource: "Catalogue Products",
        enabled: true,
        ttlSeconds: 60,
      }),
    ).toThrow();

    expect(() =>
      updateCachePolicySchema.parse({
        storeId: validUuid,
        resource: "catalogue.products",
        enabled: true,
        ttlSeconds: 0,
      }),
    ).toThrow();
  });
});
