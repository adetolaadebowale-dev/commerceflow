import { handleAddCartItem } from "@/shopping-cart/routes/carts.route";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleAddCartItem(id, request);
}
