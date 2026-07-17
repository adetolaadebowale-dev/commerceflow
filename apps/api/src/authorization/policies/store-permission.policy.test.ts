import { describe, expect, it } from "vitest";

import { StorePermissionPolicy } from "./store-permission.policy";

describe("StorePermissionPolicy", () => {
  it("grants owners and admins all store permissions", () => {
    for (const role of ["owner", "admin"] as const) {
      expect(StorePermissionPolicy.hasPermission(role, "catalogue:write")).toBe(
        true,
      );
      expect(StorePermissionPolicy.hasPermission(role, "orders:fulfill")).toBe(
        true,
      );
      expect(
        StorePermissionPolicy.hasPermission(role, "reservations:manage"),
      ).toBe(true);
    }
  });

  it("grants managers operational permissions without exceeding owner scope", () => {
    expect(
      StorePermissionPolicy.hasPermission("manager", "catalogue:write"),
    ).toBe(true);
    expect(
      StorePermissionPolicy.hasPermission("manager", "orders:lifecycle"),
    ).toBe(true);
    expect(
      StorePermissionPolicy.hasPermission("manager", "orders:fulfill"),
    ).toBe(true);
  });

  it("limits staff to read and order creation permissions", () => {
    expect(StorePermissionPolicy.hasPermission("staff", "catalogue:read")).toBe(
      true,
    );
    expect(StorePermissionPolicy.hasPermission("staff", "orders:write")).toBe(
      true,
    );
    expect(
      StorePermissionPolicy.hasPermission("staff", "warehouse-transfers:read"),
    ).toBe(true);
    expect(
      StorePermissionPolicy.hasPermission("staff", "warehouse-transfers:write"),
    ).toBe(false);
    expect(
      StorePermissionPolicy.hasPermission("staff", "warehouse-transfers:lifecycle"),
    ).toBe(false);
    expect(
      StorePermissionPolicy.hasPermission("staff", "purchase-orders:read"),
    ).toBe(true);
    expect(
      StorePermissionPolicy.hasPermission("staff", "purchase-orders:write"),
    ).toBe(false);
    expect(
      StorePermissionPolicy.hasPermission(
        "staff",
        "purchase-orders:lifecycle",
      ),
    ).toBe(false);
    expect(
      StorePermissionPolicy.hasPermission("staff", "suppliers:read"),
    ).toBe(true);
    expect(
      StorePermissionPolicy.hasPermission("staff", "suppliers:write"),
    ).toBe(false);
    expect(
      StorePermissionPolicy.hasPermission("staff", "replenishment:read"),
    ).toBe(true);
    expect(
      StorePermissionPolicy.hasPermission("staff", "replenishment:write"),
    ).toBe(false);
    expect(
      StorePermissionPolicy.hasPermission("staff", "operations:read"),
    ).toBe(true);
    expect(
      StorePermissionPolicy.hasPermission("staff", "operations:run"),
    ).toBe(false);
    expect(
      StorePermissionPolicy.hasPermission("staff", "reports:read"),
    ).toBe(true);
    expect(
      StorePermissionPolicy.hasPermission("manager", "operations:run"),
    ).toBe(true);
    expect(
      StorePermissionPolicy.hasPermission("staff", "catalogue:write"),
    ).toBe(false);
    expect(
      StorePermissionPolicy.hasPermission("staff", "orders:lifecycle"),
    ).toBe(false);
    expect(
      StorePermissionPolicy.hasPermission("staff", "orders:fulfill"),
    ).toBe(false);
    expect(StorePermissionPolicy.hasPermission("staff", "audit:read")).toBe(
      false,
    );
  });

  it("grants managers audit read access", () => {
    expect(StorePermissionPolicy.hasPermission("manager", "audit:read")).toBe(
      true,
    );
  });

  it("grants staff jobs read but not write access", () => {
    expect(StorePermissionPolicy.hasPermission("staff", "jobs:read")).toBe(
      true,
    );
    expect(StorePermissionPolicy.hasPermission("staff", "jobs:write")).toBe(
      false,
    );
  });

  it("grants managers jobs write access", () => {
    expect(StorePermissionPolicy.hasPermission("manager", "jobs:write")).toBe(
      true,
    );
  });

  it("grants staff customer read but not write access", () => {
    expect(StorePermissionPolicy.hasPermission("staff", "customers:read")).toBe(
      true,
    );
    expect(
      StorePermissionPolicy.hasPermission("staff", "customers:write"),
    ).toBe(false);
  });

  it("grants owners customer write access", () => {
    expect(StorePermissionPolicy.hasPermission("owner", "customers:write")).toBe(
      true,
    );
  });

  it("grants staff cart read and write access", () => {
    expect(StorePermissionPolicy.hasPermission("staff", "carts:read")).toBe(
      true,
    );
    expect(StorePermissionPolicy.hasPermission("staff", "carts:write")).toBe(
      true,
    );
  });

  it("grants managers cart write access", () => {
    expect(StorePermissionPolicy.hasPermission("manager", "carts:write")).toBe(
      true,
    );
  });

  it("grants store administration read to staff and write to managers", () => {
    expect(StorePermissionPolicy.hasPermission("staff", "stores:read")).toBe(
      true,
    );
    expect(StorePermissionPolicy.hasPermission("staff", "stores:write")).toBe(
      false,
    );
    expect(StorePermissionPolicy.hasPermission("manager", "stores:read")).toBe(
      true,
    );
    expect(StorePermissionPolicy.hasPermission("manager", "stores:write")).toBe(
      true,
    );
    expect(StorePermissionPolicy.hasPermission("owner", "stores:write")).toBe(
      true,
    );
  });

  it("grants data transfer read to staff and write to managers", () => {
    expect(StorePermissionPolicy.hasPermission("staff", "imports:read")).toBe(
      true,
    );
    expect(StorePermissionPolicy.hasPermission("staff", "imports:write")).toBe(
      false,
    );
    expect(StorePermissionPolicy.hasPermission("manager", "imports:write")).toBe(
      true,
    );
    expect(StorePermissionPolicy.hasPermission("staff", "exports:read")).toBe(
      true,
    );
    expect(StorePermissionPolicy.hasPermission("staff", "exports:write")).toBe(
      false,
    );
    expect(StorePermissionPolicy.hasPermission("manager", "exports:write")).toBe(
      true,
    );
  });

  it("restricts API key management to owner and admin", () => {
    expect(StorePermissionPolicy.hasPermission("owner", "api-keys:write")).toBe(
      true,
    );
    expect(StorePermissionPolicy.hasPermission("admin", "api-keys:write")).toBe(
      true,
    );
    expect(
      StorePermissionPolicy.hasPermission("manager", "api-keys:write"),
    ).toBe(false);
    expect(StorePermissionPolicy.hasPermission("staff", "api-keys:write")).toBe(
      false,
    );
    expect(StorePermissionPolicy.hasPermission("manager", "api-keys:read")).toBe(
      true,
    );
    expect(StorePermissionPolicy.hasPermission("staff", "api-keys:read")).toBe(
      true,
    );
  });

  it("grants webhook read to staff and write to managers", () => {
    expect(StorePermissionPolicy.hasPermission("staff", "webhooks:read")).toBe(
      true,
    );
    expect(StorePermissionPolicy.hasPermission("staff", "webhooks:write")).toBe(
      false,
    );
    expect(
      StorePermissionPolicy.hasPermission("manager", "webhooks:write"),
    ).toBe(true);
  });

  it("restricts feature flag writes to owner and admin", () => {
    expect(
      StorePermissionPolicy.hasPermission("owner", "feature-flags:write"),
    ).toBe(true);
    expect(
      StorePermissionPolicy.hasPermission("admin", "feature-flags:write"),
    ).toBe(true);
    expect(
      StorePermissionPolicy.hasPermission("manager", "feature-flags:write"),
    ).toBe(false);
    expect(
      StorePermissionPolicy.hasPermission("staff", "feature-flags:write"),
    ).toBe(false);
    expect(
      StorePermissionPolicy.hasPermission("manager", "feature-flags:read"),
    ).toBe(true);
    expect(
      StorePermissionPolicy.hasPermission("staff", "feature-flags:read"),
    ).toBe(true);
  });

  it("restricts platform ops read to owner/admin and write to owner", () => {
    expect(StorePermissionPolicy.hasPermission("owner", "platform:read")).toBe(
      true,
    );
    expect(StorePermissionPolicy.hasPermission("admin", "platform:read")).toBe(
      true,
    );
    expect(
      StorePermissionPolicy.hasPermission("manager", "platform:read"),
    ).toBe(false);
    expect(StorePermissionPolicy.hasPermission("staff", "platform:read")).toBe(
      false,
    );
    expect(StorePermissionPolicy.hasPermission("owner", "platform:write")).toBe(
      true,
    );
    expect(StorePermissionPolicy.hasPermission("admin", "platform:write")).toBe(
      false,
    );
    expect(
      StorePermissionPolicy.hasPermission("manager", "platform:write"),
    ).toBe(false);
  });
});
