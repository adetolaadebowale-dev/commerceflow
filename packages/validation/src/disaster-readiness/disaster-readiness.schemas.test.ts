import { describe, expect, it } from "vitest";

import {
  disasterReadinessStoreQuerySchema,
  updateRecoveryObjectivesSchema,
} from "./disaster-readiness.schemas";

describe("disaster readiness schemas", () => {
  const validUuid = "11111111-1111-1111-1111-111111111111";

  it("accepts store-scoped queries", () => {
    expect(
      disasterReadinessStoreQuerySchema.parse({ storeId: validUuid }),
    ).toEqual({ storeId: validUuid });
  });

  it("accepts recovery objective updates", () => {
    const parsed = updateRecoveryObjectivesSchema.parse({
      storeId: validUuid,
      rpoMinutes: 60,
      rtoMinutes: 120,
    });

    expect(parsed.rpoMinutes).toBe(60);
    expect(parsed.rtoMinutes).toBe(120);
  });

  it("rejects invalid RPO/RTO values", () => {
    expect(() =>
      updateRecoveryObjectivesSchema.parse({
        storeId: validUuid,
        rpoMinutes: 0,
        rtoMinutes: 120,
      }),
    ).toThrow();

    expect(() =>
      updateRecoveryObjectivesSchema.parse({
        storeId: validUuid,
        rpoMinutes: 60,
        rtoMinutes: 20_000,
      }),
    ).toThrow();
  });
});
