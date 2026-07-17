import { handleGetPlatformLoggingDiagnostics } from "@/observability/routes/observability.route";

export async function GET(request: Request): Promise<Response> {
  return handleGetPlatformLoggingDiagnostics(request);
}
