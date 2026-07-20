import { SignJWT, jwtVerify } from "jose";
import type { AuthTokens, UserRole } from "@commerceflow/types";

import { resolveAuthJwtSecret } from "../config/auth-env";

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

export interface AccessTokenPayload {
  readonly sub: string;
  readonly sid: string;
  readonly role: UserRole;
  readonly typ: "access";
}

export interface RefreshTokenPayload {
  readonly sub: string;
  readonly sid: string;
  readonly jti: string;
  readonly typ: "refresh";
}

function getJwtSecret(): Uint8Array {
  return new TextEncoder().encode(resolveAuthJwtSecret());
}

function toIsoExpiry(ttlSeconds: number): string {
  return new Date(Date.now() + ttlSeconds * 1000).toISOString();
}

export class TokenService {
  async issueTokenPair(input: {
    userId: string;
    sessionId: string;
    role: UserRole;
    refreshTokenId: string;
  }): Promise<AuthTokens> {
    const secret = getJwtSecret();
    const accessTokenExpiresAt = toIsoExpiry(ACCESS_TOKEN_TTL_SECONDS);
    const refreshTokenExpiresAt = toIsoExpiry(REFRESH_TOKEN_TTL_SECONDS);

    const accessToken = await new SignJWT({
      sid: input.sessionId,
      role: input.role,
      typ: "access",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(input.userId)
      .setIssuedAt()
      .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
      .sign(secret);

    const refreshToken = await new SignJWT({
      sid: input.sessionId,
      jti: input.refreshTokenId,
      typ: "refresh",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(input.userId)
      .setIssuedAt()
      .setExpirationTime(`${REFRESH_TOKEN_TTL_SECONDS}s`)
      .sign(secret);

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      tokenType: "Bearer",
    };
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);

    if (
      typeof payload.sub !== "string" ||
      typeof payload.sid !== "string" ||
      typeof payload.role !== "string" ||
      payload.typ !== "access"
    ) {
      throw new Error("Invalid access token payload");
    }

    return {
      sub: payload.sub,
      sid: payload.sid,
      role: payload.role as UserRole,
      typ: "access",
    };
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);

    if (
      typeof payload.sub !== "string" ||
      typeof payload.sid !== "string" ||
      typeof payload.jti !== "string" ||
      payload.typ !== "refresh"
    ) {
      throw new Error("Invalid refresh token payload");
    }

    return {
      sub: payload.sub,
      sid: payload.sid,
      jti: payload.jti,
      typ: "refresh",
    };
  }

  getRefreshTokenExpiry(): string {
    return toIsoExpiry(REFRESH_TOKEN_TTL_SECONDS);
  }
}

export const tokenService = new TokenService();
