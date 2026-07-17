import { handleGetPlatformDatabaseDiagnostics } from "@/database-optimization/routes/database-optimization.route";

export async function GET(request: Request): Promise<Response> {
  return handleGetPlatformDatabaseDiagnostics(request);
}
