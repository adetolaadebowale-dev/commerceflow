import { handleGetReturn } from "@/returns/routes/returns.route";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleGetReturn(id, request);
}
