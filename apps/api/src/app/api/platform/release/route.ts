import { handleGetPlatformRelease } from "@/deployment-readiness/routes/deployment-readiness.route";

export async function GET(request: Request): Promise<Response> {
  return handleGetPlatformRelease(request);
}
