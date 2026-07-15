import { handleOrderPurchaseOrder } from "@/purchase-orders/routes/purchase-orders.route";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleOrderPurchaseOrder(id, request);
}
