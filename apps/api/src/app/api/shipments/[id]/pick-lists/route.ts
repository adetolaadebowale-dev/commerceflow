import {
  handleCreatePickList,
  handleListShipmentPickLists,
} from "@/pick-lists/routes/pick-lists.route";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleCreatePickList(id, request);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleListShipmentPickLists(id, request);
}
