import { handleGetInventoryAdjustment } from "@/inventory-adjustments/routes/inventory-adjustments.route";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleGetInventoryAdjustment(id, request);
}
