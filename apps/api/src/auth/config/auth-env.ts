/**
 * Auth environment configuration.
 * AUTH_JWT_SECRET is required — never fall back to a hardcoded default.
 */

const INSECURE_JWT_SECRET_PLACEHOLDERS = new Set([
  "change-me-in-production",
  "commerceflow-dev-secret-change-in-production",
  "test-access-secret-value",
  "test-refresh-secret-value",
]);

export type AuthEnvSource = Readonly<Record<string, string | undefined>>;

export class AuthEnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthEnvironmentError";
  }
}

export function isInsecureJwtSecretPlaceholder(secret: string): boolean {
  return INSECURE_JWT_SECRET_PLACEHOLDERS.has(secret.trim());
}

/**
 * Resolve the JWT signing secret from the environment.
 * Throws if missing/empty. In production, also rejects known placeholders.
 */
export function resolveAuthJwtSecret(
  env: AuthEnvSource = process.env,
): string {
  const raw = env.AUTH_JWT_SECRET;
  const secret = typeof raw === "string" ? raw.trim() : "";

  if (secret.length === 0) {
    throw new AuthEnvironmentError(
      "AUTH_JWT_SECRET is required and must be a non-empty string. Set it in the environment before starting the API.",
    );
  }

  const nodeEnv = env.NODE_ENV ?? "development";
  if (
    nodeEnv === "production" &&
    isInsecureJwtSecretPlaceholder(secret)
  ) {
    throw new AuthEnvironmentError(
      "AUTH_JWT_SECRET must not use a documented placeholder value in production.",
    );
  }

  return secret;
}

/** Fail fast at process startup when auth secrets are misconfigured. */
export function assertAuthEnvironment(
  env: AuthEnvSource = process.env,
): void {
  resolveAuthJwtSecret(env);
}
