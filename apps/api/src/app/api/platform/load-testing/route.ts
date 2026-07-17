import {
  handleGetPlatformLoadTesting,
  handleUpdatePlatformLoadTesting,
} from "@/load-testing/routes/load-testing.route";

export async function GET(request: Request): Promise<Response> {
  return handleGetPlatformLoadTesting(request);
}

export async function PATCH(request: Request): Promise<Response> {
  return handleUpdatePlatformLoadTesting(request);
}
