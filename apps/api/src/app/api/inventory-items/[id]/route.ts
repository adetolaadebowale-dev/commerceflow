import { handleGetInventoryItem } from "@/inventory/routes/inventory-items.route";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { id } = await context.params;
  return handleGetInventoryItem(id, request);
}
