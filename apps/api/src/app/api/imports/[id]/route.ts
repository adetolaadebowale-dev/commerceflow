import { handleGetImportJob } from "@/data-transfer/routes/data-transfer.route";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleGetImportJob(id, request);
}
