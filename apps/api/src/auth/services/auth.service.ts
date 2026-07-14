import type {
  AuthenticatedUser,
  AuthTokens,
  User,
} from "@commerceflow/types";
import type {
  LoginInput,
  RefreshTokenInput,
  RegisterInput,
} from "@commerceflow/validation";

import { AUTH_ERROR_CODES, AuthError } from "../errors";
import {
  getSessionRepository,
  getUserRepository,
} from "../repositories";
import type { SessionRepository } from "../repositories/session.repository";
import type { UserRepository } from "../repositories/user.repository";
import type { RequestContext, StoredSession, StoredUser } from "../types";
import { getPermissionsForRole } from "./permission.service";
import { hashPassword, verifyPassword } from "./password.service";
import { tokenService } from "./token.service";

function toPublicUser(storedUser: StoredUser): User {
  return {
    id: storedUser.id,
    email: storedUser.email,
    emailVerified: storedUser.emailVerified,
    firstName: storedUser.firstName,
    lastName: storedUser.lastName,
    role: storedUser.role,
    createdAt: storedUser.createdAt,
    updatedAt: storedUser.updatedAt,
  };
}

function toPublicSession(session: StoredSession) {
  return {
    id: session.id,
    userId: session.userId,
    expiresAt: session.expiresAt,
    createdAt: session.createdAt,
    lastActiveAt: session.lastActiveAt,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
  };
}

function assertActiveSession(session: StoredSession): void {
  if (session.revoked) {
    throw new AuthError(
      AUTH_ERROR_CODES.SESSION_REVOKED,
      "Session has been revoked",
      401,
    );
  }

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    throw new AuthError(
      AUTH_ERROR_CODES.SESSION_EXPIRED,
      "Session has expired",
      401,
    );
  }
}

export interface AuthServiceDependencies {
  readonly userRepository?: UserRepository;
  readonly sessionRepository?: SessionRepository;
}

export class AuthService {
  private readonly userRepository: UserRepository;
  private readonly sessionRepository: SessionRepository;

  constructor(dependencies: AuthServiceDependencies = {}) {
    this.userRepository = dependencies.userRepository ?? getUserRepository();
    this.sessionRepository =
      dependencies.sessionRepository ?? getSessionRepository();
  }

  async register(
    input: RegisterInput,
    context: RequestContext = {},
  ): Promise<{ user: User; tokens: AuthTokens }> {
    const existingUser = await this.userRepository.findByEmail(input.email);

    if (existingUser) {
      throw new AuthError(
        AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS,
        "An account with this email already exists",
        409,
      );
    }

    const passwordHash = await hashPassword(input.password);
    const storedUser = await this.userRepository.create({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
    });

    return this.createAuthenticatedSession(storedUser, context);
  }

  async login(
    input: LoginInput,
    context: RequestContext = {},
  ): Promise<{ user: User; tokens: AuthTokens }> {
    const storedUser = await this.userRepository.findByEmail(input.email);

    if (!storedUser) {
      throw new AuthError(
        AUTH_ERROR_CODES.INVALID_CREDENTIALS,
        "Invalid email or password",
        401,
      );
    }

    const passwordValid = await verifyPassword(
      input.password,
      storedUser.passwordHash,
    );

    if (!passwordValid) {
      throw new AuthError(
        AUTH_ERROR_CODES.INVALID_CREDENTIALS,
        "Invalid email or password",
        401,
      );
    }

    return this.createAuthenticatedSession(storedUser, context);
  }

  async logout(input: {
    accessToken?: string;
    refreshToken?: string;
  }): Promise<{ success: true }> {
    if (input.refreshToken) {
      await this.revokeByRefreshToken(input.refreshToken);
      return { success: true };
    }

    if (input.accessToken) {
      await this.revokeByAccessToken(input.accessToken);
      return { success: true };
    }

    throw new AuthError(
      AUTH_ERROR_CODES.UNAUTHENTICATED,
      "Authentication credentials were not provided",
      401,
    );
  }

  async refreshToken(
    input: RefreshTokenInput,
  ): Promise<{ tokens: AuthTokens }> {
    let payload;

    try {
      payload = await tokenService.verifyRefreshToken(input.refreshToken);
    } catch {
      throw new AuthError(
        AUTH_ERROR_CODES.INVALID_TOKEN,
        "Invalid refresh token",
        401,
      );
    }

    const session = await this.sessionRepository.findById(payload.sid);

    if (!session) {
      throw new AuthError(
        AUTH_ERROR_CODES.INVALID_TOKEN,
        "Invalid refresh token",
        401,
      );
    }

    assertActiveSession(session);

    if (session.refreshTokenId !== payload.jti) {
      throw new AuthError(
        AUTH_ERROR_CODES.INVALID_TOKEN,
        "Invalid refresh token",
        401,
      );
    }

    const storedUser = await this.userRepository.findById(payload.sub);

    if (!storedUser) {
      throw new AuthError(
        AUTH_ERROR_CODES.USER_NOT_FOUND,
        "User not found",
        401,
      );
    }

    const nextRefreshTokenId = crypto.randomUUID();
    await this.sessionRepository.updateRefreshTokenId(
      session.id,
      nextRefreshTokenId,
    );
    await this.sessionRepository.touch(session.id);

    const tokens = await tokenService.issueTokenPair({
      userId: storedUser.id,
      sessionId: session.id,
      role: storedUser.role,
      refreshTokenId: nextRefreshTokenId,
    });

    return { tokens };
  }

  async getCurrentUser(accessToken: string): Promise<AuthenticatedUser> {
    const authContext = await this.resolveAuthenticatedSession(accessToken);

    return {
      user: authContext.user,
      permissions: getPermissionsForRole(authContext.user.role),
      session: authContext.session,
    };
  }

  async resolveAuthenticatedSession(accessToken: string | null): Promise<{
    userId: string;
    sessionId: string;
    user: User;
    session: ReturnType<typeof toPublicSession>;
  }> {
    if (!accessToken) {
      throw new AuthError(
        AUTH_ERROR_CODES.UNAUTHENTICATED,
        "Authentication credentials were not provided",
        401,
      );
    }

    let payload;

    try {
      payload = await tokenService.verifyAccessToken(accessToken);
    } catch {
      throw new AuthError(
        AUTH_ERROR_CODES.INVALID_TOKEN,
        "Invalid access token",
        401,
      );
    }

    const session = await this.sessionRepository.findById(payload.sid);

    if (!session) {
      throw new AuthError(
        AUTH_ERROR_CODES.INVALID_TOKEN,
        "Invalid access token",
        401,
      );
    }

    assertActiveSession(session);

    const storedUser = await this.userRepository.findById(payload.sub);

    if (!storedUser) {
      throw new AuthError(
        AUTH_ERROR_CODES.USER_NOT_FOUND,
        "User not found",
        401,
      );
    }

    await this.sessionRepository.touch(session.id);

    return {
      userId: storedUser.id,
      sessionId: session.id,
      user: toPublicUser(storedUser),
      session: toPublicSession(session),
    };
  }

  private async createAuthenticatedSession(
    storedUser: StoredUser,
    context: RequestContext,
  ): Promise<{ user: User; tokens: AuthTokens }> {
    const refreshTokenId = crypto.randomUUID();
    const session = await this.sessionRepository.create({
      userId: storedUser.id,
      expiresAt: tokenService.getRefreshTokenExpiry(),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      refreshTokenId,
    });

    const tokens = await tokenService.issueTokenPair({
      userId: storedUser.id,
      sessionId: session.id,
      role: storedUser.role,
      refreshTokenId,
    });

    return {
      user: toPublicUser(storedUser),
      tokens,
    };
  }

  private async revokeByAccessToken(accessToken: string): Promise<void> {
    try {
      const payload = await tokenService.verifyAccessToken(accessToken);
      await this.sessionRepository.revoke(payload.sid);
    } catch {
      throw new AuthError(
        AUTH_ERROR_CODES.INVALID_TOKEN,
        "Invalid access token",
        401,
      );
    }
  }

  private async revokeByRefreshToken(refreshToken: string): Promise<void> {
    try {
      const payload = await tokenService.verifyRefreshToken(refreshToken);
      await this.sessionRepository.revoke(payload.sid);
    } catch {
      throw new AuthError(
        AUTH_ERROR_CODES.INVALID_TOKEN,
        "Invalid refresh token",
        401,
      );
    }
  }
}

export const authService = new AuthService();
