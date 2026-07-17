import { describe, expect, it } from "vitest";

import {
  platformStoreQuerySchema,
  updateMaintenanceModeSchema,
} from "./platform-operations.schemas";

describe("platform operations schemas", () => {
  const validUuid = "11111111-1111-1111-1111-111111111111";

  it("accepts a store-scoped query", () => {
    expect(platformStoreQuerySchema.parse({ storeId: validUuid })).toEqual({
      storeId: validUuid,
    });
  });

  it("accepts maintenance mode updates", () => {
    const parsed = updateMaintenanceModeSchema.parse({
      storeId: validUuid,
      maintenanceMode: true,
      maintenanceMessage: "Upgrading databases",
    });

    expect(parsed.maintenanceMode).toBe(true);
    expect(parsed.maintenanceMessage).toBe("Upgrading databases");
  });

  it("allows clearing the maintenance message", () => {
    const parsed = updateMaintenanceModeSchema.parse({
      storeId: validUuid,
      maintenanceMode: false,
      maintenanceMessage: null,
    });

    expect(parsed.maintenanceMessage).toBeNull();
  });

  it("rejects invalid store ids", () => {
    expect(() =>
      platformStoreQuerySchema.parse({ storeId: "not-a-uuid" }),
    ).toThrow();
  });
});
