import { handleMarkPacked } from "@/pick-lists/routes/pick-lists.route";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleMarkPacked(id, request);
}
