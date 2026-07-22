import { describe, expect, it } from "vitest";

import { darkColors, lightColors } from "./colors";
import { radii } from "./radii";
import { spacing } from "./spacing";
import { config } from "../lib/config";

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

describe("mobile config", () => {
  it("resolves an app environment", () => {
    expect(["development", "production"]).toContain(config.appEnvironment);
  });

  it("exposes a non-empty apiBaseUrl", () => {
    expect(config.apiBaseUrl.length).toBeGreaterThan(0);
    expect(config.apiBaseUrl.endsWith("/")).toBe(false);
  });
});
