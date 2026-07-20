import { afterEach, describe, expect, it, vi } from "vitest";

import { PLATFORM_HARDENING_ERROR_CODES } from "@/platform-hardening/errors";
import { PlatformHardeningError } from "@/platform-hardening/errors";
import { rateLimitService } from "@/platform-hardening/services/rate-limit.service";

import { handleLogin } from "./login.route";
import { handleRegister } from "./register.route";

const { loginMock, registerMock } = vi.hoisted(() => ({
  loginMock: vi.fn(async () => ({
    user: { id: "u1", email: "a@example.com" },
    tokens: {
      accessToken: "a",
      refreshToken: "r",
      tokenType: "Bearer" as const,
      accessTokenExpiresAt: new Date().toISOString(),
      refreshTokenExpiresAt: new Date().toISOString(),
    },
    permissions: [],
    session: {
      id: "s1",
      userId: "u1",
      expiresAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    },
  })),
  registerMock: vi.fn(async () => ({
    user: { id: "u1", email: "a@example.com" },
    tokens: {
      accessToken: "a",
      refreshToken: "r",
      tokenType: "Bearer" as const,
      accessTokenExpiresAt: new Date().toISOString(),
      refreshTokenExpiresAt: new Date().toISOString(),
    },
    permissions: [],
    session: {
      id: "s1",
      userId: "u1",
      expiresAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    },
  })),
}));

vi.mock("../services", () => ({
  authService: {
    login: loginMock,
    register: registerMock,
  },
}));

function jsonRequest(path: string, body: unknown, ip: string): Request {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

describe("auth route rate limiting", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    loginMock.mockClear();
    registerMock.mockClear();
  });

  it("returns 429 for login when rate limited before authentication", async () => {
    const assertSpy = vi
      .spyOn(rateLimitService, "assertAllowed")
      .mockImplementation(() => {
        throw new PlatformHardeningError(
          PLATFORM_HARDENING_ERROR_CODES.RATE_LIMITED,
          "Rate limit exceeded for auth.login",
          429,
          {
            allowed: false,
            remaining: 0,
            resetAt: new Date(Date.now() + 60_000).toISOString(),
            limit: 20,
            windowMs: 60_000,
          },
        );
      });

    const response = await handleLogin(
      jsonRequest(
        "/api/auth/login",
        { email: "a@example.com", password: "password123" },
        "203.0.113.10",
      ),
    );

    expect(assertSpy).toHaveBeenCalledWith("auth.login", "203.0.113.10");
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    expect(loginMock).not.toHaveBeenCalled();

    const body = (await response.json()) as {
      error: { code: string; details?: { remaining?: number } };
    };
    expect(body.error.code).toBe(PLATFORM_HARDENING_ERROR_CODES.RATE_LIMITED);
    expect(body.error.details?.remaining).toBe(0);
  });

  it("returns 429 for registration when rate limited before authentication", async () => {
    const assertSpy = vi
      .spyOn(rateLimitService, "assertAllowed")
      .mockImplementation(() => {
        throw new PlatformHardeningError(
          PLATFORM_HARDENING_ERROR_CODES.RATE_LIMITED,
          "Rate limit exceeded for auth.register",
          429,
          {
            allowed: false,
            remaining: 0,
            resetAt: new Date(Date.now() + 60_000).toISOString(),
            limit: 10,
            windowMs: 60_000,
          },
        );
      });

    const response = await handleRegister(
      jsonRequest(
        "/api/auth/register",
        {
          email: "new@example.com",
          password: "password123",
          firstName: "New",
          lastName: "User",
        },
        "198.51.100.10",
      ),
    );

    expect(assertSpy).toHaveBeenCalledWith("auth.register", "198.51.100.10");
    expect(response.status).toBe(429);
    expect(registerMock).not.toHaveBeenCalled();
  });

  it("invokes login after rate-limit allowance", async () => {
    vi.spyOn(rateLimitService, "assertAllowed").mockReturnValue({
      allowed: true,
      remaining: 19,
      resetAt: new Date(Date.now() + 60_000).toISOString(),
      limit: 20,
      windowMs: 60_000,
    });

    const response = await handleLogin(
      jsonRequest(
        "/api/auth/login",
        { email: "a@example.com", password: "password123" },
        "203.0.113.99",
      ),
    );

    expect(response.status).toBe(200);
    expect(loginMock).toHaveBeenCalledOnce();
  });
});
