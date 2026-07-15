import {
  handleCreatePurchaseOrder,
  handleListPurchaseOrders,
} from "@/purchase-orders/routes/purchase-orders.route";

export async function GET(request: Request): Promise<Response> {
  return handleListPurchaseOrders(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleCreatePurchaseOrder(request);
}
