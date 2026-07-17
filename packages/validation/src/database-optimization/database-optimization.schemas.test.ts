import { describe, expect, it } from "vitest";

import { databaseOptimizationStoreQuerySchema } from "./database-optimization.schemas";

describe("database optimization schemas", () => {
  const validUuid = "11111111-1111-1111-1111-111111111111";

  it("accepts store-scoped queries", () => {
    expect(
      databaseOptimizationStoreQuerySchema.parse({ storeId: validUuid }),
    ).toEqual({ storeId: validUuid });
  });

  it("rejects invalid store ids", () => {
    expect(() =>
      databaseOptimizationStoreQuerySchema.parse({ storeId: "not-a-uuid" }),
    ).toThrow();
  });
});
