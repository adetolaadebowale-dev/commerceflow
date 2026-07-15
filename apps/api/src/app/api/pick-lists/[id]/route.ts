import { handleGetPickList } from "@/pick-lists/routes/pick-lists.route";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleGetPickList(id, request);
}
