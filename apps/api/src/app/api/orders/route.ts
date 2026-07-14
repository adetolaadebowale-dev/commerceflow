import {
  handleCreateOrder,
  handleListOrders,
} from "@/orders/routes/orders.route";

export async function GET(request: Request): Promise<Response> {
  return handleListOrders(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleCreateOrder(request);
}
