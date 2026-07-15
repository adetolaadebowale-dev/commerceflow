import { handleGetRefund } from "@/refunds/routes/refunds.route";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleGetRefund(id, request);
}
