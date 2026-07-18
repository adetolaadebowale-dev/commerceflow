export interface AuthTokens {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly accessTokenExpiresAt: string;
  readonly refreshTokenExpiresAt: string;
  readonly tokenType: "Bearer";
}

export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: string;
}

export interface AuthSession {
  readonly id: string;
  readonly userId: string;
  readonly expiresAt: string;
  readonly createdAt: string;
  readonly lastActiveAt: string;
}

export interface AuthenticatedSession {
  readonly user: AuthUser;
  readonly permissions: readonly unknown[];
  readonly session: AuthSession;
}

export interface LoginPayload {
  readonly email: string;
  readonly password: string;
}
