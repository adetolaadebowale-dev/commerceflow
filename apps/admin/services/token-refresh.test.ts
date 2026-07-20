import { afterEach, describe, expect, it, vi } from "vitest";

import { refreshStoredAccessToken } from "@/services/token-refresh";
import {
  clearStoredTokens,
  getStoredAccessToken,
  setStoredTokens,
} from "@/services/token-storage";

describe("refreshStoredAccessToken", () => {
  afterEach(() => {
    clearStoredTokens();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("stores rotated tokens from /api/auth/refresh", async () => {
    setStoredTokens({
      accessToken: "expired-access",
      refreshToken: "valid-refresh",
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              tokens: {
                accessToken: "new-access",
                refreshToken: "new-refresh",
              },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const token = await refreshStoredAccessToken();

    expect(token).toBe("new-access");
    expect(getStoredAccessToken()).toBe("new-access");
  });

  it("clears tokens when refresh fails", async () => {
    setStoredTokens({
      accessToken: "expired-access",
      refreshToken: "bad-refresh",
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { code: "INVALID_TOKEN", message: "Invalid refresh token" },
          }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const token = await refreshStoredAccessToken();

    expect(token).toBeNull();
    expect(getStoredAccessToken()).toBeNull();
  });
});
