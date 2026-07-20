import { describe, expect, it, vi } from "vitest";

vi.mock("expo-constants", () => ({
  default: {
    expoConfig: {
      extra: { apiBaseUrl: "http://localhost:3000" },
    },
  },
}));

import { darkColors, lightColors } from "./colors";
import { radii } from "./radii";
import { spacing } from "./spacing";
import { appEnvironment } from "../lib/env";

describe("mobile theme tokens", () => {
  it("exposes light and dark palettes with matching keys", () => {
    expect(Object.keys(lightColors).sort()).toEqual(
      Object.keys(darkColors).sort(),
    );
    expect(lightColors.primary).not.toEqual(darkColors.primary);
  });

  it("includes spacing and radius scales", () => {
    expect(spacing.md).toBe(16);
    expect(radii.pill).toBe(999);
  });
});

describe("mobile env", () => {
  it("resolves an app environment", () => {
    expect(["development", "production"]).toContain(appEnvironment);
  });
});
