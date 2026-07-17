import {
  handleGetPlatformCachePolicies,
  handleUpdatePlatformCachePolicies,
} from "@/platform-hardening/routes/platform-hardening.route";

export async function GET(request: Request): Promise<Response> {
  return handleGetPlatformCachePolicies(request);
}

export async function PATCH(request: Request): Promise<Response> {
  return handleUpdatePlatformCachePolicies(request);
}
