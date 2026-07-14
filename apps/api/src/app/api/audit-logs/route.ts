import { handleListAuditLogs } from "@/audit/routes/audit-logs.route";

export async function GET(request: Request): Promise<Response> {
  return handleListAuditLogs(request);
}
