import { handleGetPlatformDisasterReadiness } from "@/disaster-readiness/routes/disaster-readiness.route";

export async function GET(request: Request): Promise<Response> {
  return handleGetPlatformDisasterReadiness(request);
}
