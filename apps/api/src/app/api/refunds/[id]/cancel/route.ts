import { handleCancelRefund } from "@/refunds/routes/refunds.route";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleCancelRefund(id, request);
}
