import { describe, expect, it } from "vitest";

import {
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  resetPasswordSchema,
} from "./index";

describe("registerSchema", () => {
  it("accepts valid registration input", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "password123",
      firstName: "Jane",
      lastName: "Doe",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({
      email: "not-an-email",
      password: "password123",
      firstName: "Jane",
      lastName: "Doe",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "short",
      firstName: "Jane",
      lastName: "Doe",
    });

    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid login input", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "password123",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({
      email: "invalid-email",
      password: "password123",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a missing password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
    });

    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("accepts a valid email", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "user@example.com",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "invalid-email",
    });

    expect(result.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("accepts matching passwords", () => {
    const result = resetPasswordSchema.safeParse({
      token: "reset-token-123",
      password: "newpassword123",
      confirmPassword: "newpassword123",
    });

    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = resetPasswordSchema.safeParse({
      token: "reset-token-123",
      password: "newpassword123",
      confirmPassword: "differentpassword",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a missing token", () => {
    const result = resetPasswordSchema.safeParse({
      token: "",
      password: "newpassword123",
      confirmPassword: "newpassword123",
    });

    expect(result.success).toBe(false);
  });
});

describe("refreshTokenSchema", () => {
  it("accepts a valid refresh token", () => {
    const result = refreshTokenSchema.safeParse({
      refreshToken: "valid-refresh-token",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty refresh token", () => {
    const result = refreshTokenSchema.safeParse({
      refreshToken: "",
    });

    expect(result.success).toBe(false);
  });
});
