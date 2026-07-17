import { handleUpdatePlatformMaintenance } from "@/platform-operations/routes/platform-operations.route";

export async function PATCH(request: Request): Promise<Response> {
  return handleUpdatePlatformMaintenance(request);
}
