import { handleGetAuditLog } from "@/audit/routes/audit-logs.route";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleGetAuditLog(id, request);
}
