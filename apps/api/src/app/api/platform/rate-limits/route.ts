import { handleGetPlatformRateLimits } from "@/platform-hardening/routes/platform-hardening.route";

export async function GET(request: Request): Promise<Response> {
  return handleGetPlatformRateLimits(request);
}
