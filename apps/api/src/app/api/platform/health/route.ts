import { handleGetPlatformHealth } from "@/platform-operations/routes/platform-operations.route";

export async function GET(request: Request): Promise<Response> {
  return handleGetPlatformHealth(request);
}
