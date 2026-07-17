import { handleGetPlatformDiagnostics } from "@/platform-operations/routes/platform-operations.route";

export async function GET(request: Request): Promise<Response> {
  return handleGetPlatformDiagnostics(request);
}
