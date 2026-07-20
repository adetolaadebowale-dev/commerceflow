import { afterEach, describe, expect, it } from "vitest";

import {
  AuthEnvironmentError,
  assertAuthEnvironment,
  isInsecureJwtSecretPlaceholder,
  resolveAuthJwtSecret,
} from "./auth-env";

describe("auth-env", () => {
  const originalSecret = process.env.AUTH_JWT_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.AUTH_JWT_SECRET;
    } else {
      process.env.AUTH_JWT_SECRET = originalSecret;
    }
  });

  it("resolves AUTH_JWT_SECRET when set", () => {
    expect(
      resolveAuthJwtSecret({ AUTH_JWT_SECRET: "  strong-secret-value  " }),
    ).toBe("strong-secret-value");
  });

  it("fails when AUTH_JWT_SECRET is missing", () => {
    expect(() => resolveAuthJwtSecret({})).toThrow(AuthEnvironmentError);
    expect(() => resolveAuthJwtSecret({ AUTH_JWT_SECRET: "   " })).toThrow(
      /AUTH_JWT_SECRET is required/,
    );
  });

  it("rejects placeholder secrets in production", () => {
    expect(() =>
      resolveAuthJwtSecret({
        NODE_ENV: "production",
        AUTH_JWT_SECRET: "change-me-in-production",
      }),
    ).toThrow(/placeholder/);
  });

  it("allows placeholders outside production for local templates", () => {
    expect(
      resolveAuthJwtSecret({
        NODE_ENV: "development",
        AUTH_JWT_SECRET: "change-me-in-production",
      }),
    ).toBe("change-me-in-production");
  });

  it("assertAuthEnvironment fails fast without a secret", () => {
    expect(() => assertAuthEnvironment({})).toThrow(AuthEnvironmentError);
  });

  it("detects insecure placeholders", () => {
    expect(
      isInsecureJwtSecretPlaceholder(
        "commerceflow-dev-secret-change-in-production",
      ),
    ).toBe(true);
    expect(isInsecureJwtSecretPlaceholder("a-real-random-secret")).toBe(false);
  });
});
