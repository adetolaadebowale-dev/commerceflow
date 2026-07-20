import type { RequestContext } from "../types";

export function getRequestContext(request: Request): RequestContext {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim();

  return {
    ipAddress: ipAddress || undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };
}

/** Stable client identity for auth rate limiting (IP when available). */
export function getRateLimitIdentity(request: Request): string {
  const context = getRequestContext(request);
  return context.ipAddress ?? "anonymous";
}

export function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}
