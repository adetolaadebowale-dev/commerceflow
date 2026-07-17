import {
  handleGetPlatformRecovery,
  handleUpdatePlatformRecovery,
} from "@/disaster-readiness/routes/disaster-readiness.route";

export async function GET(request: Request): Promise<Response> {
  return handleGetPlatformRecovery(request);
}

export async function PATCH(request: Request): Promise<Response> {
  return handleUpdatePlatformRecovery(request);
}
