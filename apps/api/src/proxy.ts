import { type NextRequest, NextResponse } from "next/server";

const DEFAULT_DEV_ORIGINS = [
  "http://localhost:3001",
  "http://127.0.0.1:3001",
] as const;

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
  "Access-Control-Max-Age": "86400",
} as const;

function resolveAllowedOrigins(): readonly string[] {
  const fromEnv = process.env.CORS_ALLOWED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (fromEnv && fromEnv.length > 0) {
    return fromEnv;
  }

  if (process.env.NODE_ENV === "production") {
    return [];
  }

  return DEFAULT_DEV_ORIGINS;
}

function isAllowedOrigin(origin: string): boolean {
  if (!origin) {
    return false;
  }

  return resolveAllowedOrigins().includes(origin);
}

export function proxy(request: NextRequest): NextResponse {
  const origin = request.headers.get("origin") ?? "";
  const allowed = isAllowedOrigin(origin);

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        ...(allowed ? { "Access-Control-Allow-Origin": origin } : {}),
        ...CORS_HEADERS,
        Vary: "Origin",
      },
    });
  }

  const response = NextResponse.next();

  if (allowed) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
  }

  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
