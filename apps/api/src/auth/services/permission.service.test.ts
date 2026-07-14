import { describe, expect, it } from "vitest";

import { getPermissionsForRole } from "./permission.service";

describe("permission.service", () => {
  it("returns admin permissions", () => {
    const permissions = getPermissionsForRole("admin");
    const codes = permissions.map((permission) => permission.code);

    expect(codes).toContain("users:manage");
    expect(codes).toContain("catalogue:read");
    expect(codes).toContain("orders:manage");
  });

  it("returns customer permissions", () => {
    const permissions = getPermissionsForRole("customer");
    const codes = permissions.map((permission) => permission.code);

    expect(codes).toContain("profile:read");
    expect(codes).toContain("orders:read");
    expect(codes).not.toContain("users:manage");
    expect(codes).not.toContain("catalogue:read");
  });
});
