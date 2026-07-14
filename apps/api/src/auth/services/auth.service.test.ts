import { describe, expect, it } from "vitest";

import { AUTH_ERROR_CODES, AuthError } from "../errors";
import { createMemoryAuthService } from "../testing/auth-test-utils";
import { tokenService } from "./token.service";

function uniqueEmail(): string {
  return `user-${crypto.randomUUID()}@example.com`;
}

function validRegisterInput(email: string) {
  return {
    email,
    password: "password123",
    firstName: "Jane",
    lastName: "Doe",
  };
}

describe("AuthService", () => {
  it("registers a user successfully", async () => {
    const { authService } = createMemoryAuthService();
    const email = uniqueEmail();

    const result = await authService.register(validRegisterInput(email));

    expect(result.user.email).toBe(email);
    expect(result.user.role).toBe("customer");
    expect(result.tokens.accessToken).toBeTruthy();
    expect(result.tokens.refreshToken).toBeTruthy();
    expect(result.tokens.tokenType).toBe("Bearer");
  });

  it("rejects duplicate email registration", async () => {
    const { authService } = createMemoryAuthService();
    const email = uniqueEmail();
    const input = validRegisterInput(email);

    await authService.register(input);

    await expect(authService.register(input)).rejects.toMatchObject({
      code: AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS,
      status: 409,
    });
  });

  it("logs in successfully", async () => {
    const { authService } = createMemoryAuthService();
    const email = uniqueEmail();
    const input = validRegisterInput(email);

    await authService.register(input);

    const result = await authService.login({
      email,
      password: input.password,
    });

    expect(result.user.email).toBe(email);
    expect(result.tokens.accessToken).toBeTruthy();
    expect(result.tokens.refreshToken).toBeTruthy();
  });

  it("rejects login with an invalid password", async () => {
    const { authService } = createMemoryAuthService();
    const email = uniqueEmail();
    const input = validRegisterInput(email);

    await authService.register(input);

    await expect(
      authService.login({
        email,
        password: "wrong-password",
      }),
    ).rejects.toMatchObject({
      code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
      status: 401,
    });
  });

  it("logs out a session", async () => {
    const { authService } = createMemoryAuthService();
    const email = uniqueEmail();
    const input = validRegisterInput(email);
    const { tokens } = await authService.register(input);

    const result = await authService.logout({
      refreshToken: tokens.refreshToken,
    });

    expect(result).toEqual({ success: true });

    await expect(
      authService.getCurrentUser(tokens.accessToken),
    ).rejects.toBeInstanceOf(AuthError);
  });

  it("refreshes tokens", async () => {
    const { authService } = createMemoryAuthService();
    const email = uniqueEmail();
    const input = validRegisterInput(email);
    const { tokens } = await authService.register(input);

    const result = await authService.refreshToken({
      refreshToken: tokens.refreshToken,
    });

    expect(result.tokens.accessToken).toBeTruthy();
    expect(result.tokens.refreshToken).toBeTruthy();
    expect(result.tokens.refreshToken).not.toBe(tokens.refreshToken);

    const currentUser = await authService.getCurrentUser(
      result.tokens.accessToken,
    );

    expect(currentUser.user.email).toBe(email);
  });

  it("returns the current user", async () => {
    const { authService } = createMemoryAuthService();
    const email = uniqueEmail();
    const input = validRegisterInput(email);
    const { tokens } = await authService.register(input);

    const currentUser = await authService.getCurrentUser(tokens.accessToken);

    expect(currentUser.user.email).toBe(email);
    expect(currentUser.session.userId).toBe(currentUser.user.id);
    expect(currentUser.permissions.length).toBeGreaterThan(0);
  });

  it("rejects a revoked session on refresh", async () => {
    const { authService } = createMemoryAuthService();
    const email = uniqueEmail();
    const { tokens } = await authService.register(validRegisterInput(email));

    await authService.logout({ refreshToken: tokens.refreshToken });

    await expect(
      authService.refreshToken({ refreshToken: tokens.refreshToken }),
    ).rejects.toMatchObject({
      code: AUTH_ERROR_CODES.SESSION_REVOKED,
      status: 401,
    });
  });

  it("rejects an expired session on refresh", async () => {
    const { authService, userRepository, sessionRepository } =
      createMemoryAuthService();
    const email = uniqueEmail();
    const input = validRegisterInput(email);
    const passwordHash = "test-hash";

    const user = await userRepository.create({
      email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
    });

    const refreshTokenId = crypto.randomUUID();
    const session = await sessionRepository.create({
      userId: user.id,
      expiresAt: new Date(Date.now() - 60_000).toISOString(),
      refreshTokenId,
    });

    const tokens = await tokenService.issueTokenPair({
      userId: user.id,
      sessionId: session.id,
      role: user.role,
      refreshTokenId,
    });

    await expect(
      authService.refreshToken({ refreshToken: tokens.refreshToken }),
    ).rejects.toMatchObject({
      code: AUTH_ERROR_CODES.SESSION_EXPIRED,
      status: 401,
    });
  });
});
