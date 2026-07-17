import { handleGetPlatformScalability } from "@/load-testing/routes/load-testing.route";

export async function GET(request: Request): Promise<Response> {
  return handleGetPlatformScalability(request);
}
