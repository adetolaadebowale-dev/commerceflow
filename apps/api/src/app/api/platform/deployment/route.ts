import {
  handleGetPlatformDeployment,
  handleUpdatePlatformDeployment,
} from "@/deployment-readiness/routes/deployment-readiness.route";

export async function GET(request: Request): Promise<Response> {
  return handleGetPlatformDeployment(request);
}

export async function PATCH(request: Request): Promise<Response> {
  return handleUpdatePlatformDeployment(request);
}
