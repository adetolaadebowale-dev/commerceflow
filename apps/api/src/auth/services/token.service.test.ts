import { describe, expect, it } from "vitest";

import { TokenService } from "./token.service";

describe("TokenService", () => {
  const tokenService = new TokenService();

  it("issues an access token", async () => {
    const tokens = await tokenService.issueTokenPair({
      userId: "user-1",
      sessionId: "session-1",
      role: "customer",
      refreshTokenId: "refresh-id-1",
    });

    const payload = await tokenService.verifyAccessToken(tokens.accessToken);

    expect(payload.sub).toBe("user-1");
    expect(payload.sid).toBe("session-1");
    expect(payload.role).toBe("customer");
    expect(payload.typ).toBe("access");
  });

  it("issues a refresh token", async () => {
    const tokens = await tokenService.issueTokenPair({
      userId: "user-1",
      sessionId: "session-1",
      role: "customer",
      refreshTokenId: "refresh-id-1",
    });

    const payload = await tokenService.verifyRefreshToken(tokens.refreshToken);

    expect(payload.sub).toBe("user-1");
    expect(payload.sid).toBe("session-1");
    expect(payload.jti).toBe("refresh-id-1");
    expect(payload.typ).toBe("refresh");
  });

  it("verifies issued tokens", async () => {
    const tokens = await tokenService.issueTokenPair({
      userId: "user-2",
      sessionId: "session-2",
      role: "admin",
      refreshTokenId: "refresh-id-2",
    });

    await expect(
      tokenService.verifyAccessToken(tokens.accessToken),
    ).resolves.toMatchObject({
      sub: "user-2",
      sid: "session-2",
      role: "admin",
      typ: "access",
    });

    await expect(
      tokenService.verifyRefreshToken(tokens.refreshToken),
    ).resolves.toMatchObject({
      sub: "user-2",
      sid: "session-2",
      jti: "refresh-id-2",
      typ: "refresh",
    });
  });

  it("rejects an invalid token", async () => {
    await expect(
      tokenService.verifyAccessToken("not-a-valid-token"),
    ).rejects.toThrow();

    await expect(
      tokenService.verifyRefreshToken("not-a-valid-token"),
    ).rejects.toThrow();
  });
});
