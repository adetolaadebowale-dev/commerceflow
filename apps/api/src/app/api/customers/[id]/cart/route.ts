import { handleGetCustomerCart } from "@/shopping-cart/routes/carts.route";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleGetCustomerCart(id, request);
}
