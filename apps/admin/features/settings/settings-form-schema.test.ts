import { describe, expect, it } from "vitest";

import {
  storeSettingsFormSchema,
  toStoreSettingsPayload,
} from "@/features/settings/store-settings-form-schema";
import {
  organizationSettingsFormSchema,
  toOrganizationSettingsPayload,
} from "@/features/settings/organization-settings-form-schema";
import {
  formatPersonName,
  formatRoleLabel,
} from "@/features/settings/settings-labels";

describe("store-settings-form-schema", () => {
  it("accepts valid store settings", () => {
    const parsed = storeSettingsFormSchema.parse({
      name: "Main Store",
      slug: "main-store",
      defaultCurrency: "USD",
      defaultTimezone: "UTC",
      locale: "en-US",
    });
    expect(toStoreSettingsPayload(parsed)).toEqual(parsed);
  });

  it("rejects lowercase currency", () => {
    const parsed = storeSettingsFormSchema.safeParse({
      name: "Main Store",
      slug: "main-store",
      defaultCurrency: "usd",
      defaultTimezone: "UTC",
      locale: "en-US",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("organization-settings-form-schema", () => {
  it("maps name and slug", () => {
    const parsed = organizationSettingsFormSchema.parse({
      name: "Acme Org",
      slug: "acme-org",
    });
    expect(toOrganizationSettingsPayload(parsed)).toEqual({
      name: "Acme Org",
      slug: "acme-org",
    });
  });
});

describe("settings-labels", () => {
  it("formats role and person name", () => {
    expect(formatRoleLabel("admin")).toBe("Admin");
    expect(formatPersonName("Alex", "Admin", "a@example.com")).toBe(
      "Alex Admin",
    );
    expect(formatPersonName("", "", "a@example.com")).toBe("a@example.com");
  });
});
