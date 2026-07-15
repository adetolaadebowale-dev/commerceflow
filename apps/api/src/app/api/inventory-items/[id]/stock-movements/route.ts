import { handleListInventoryItemStockMovements } from "@/fulfillment/routes/fulfillment.route";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleListInventoryItemStockMovements(id, request);
}
