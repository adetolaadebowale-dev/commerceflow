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
});
