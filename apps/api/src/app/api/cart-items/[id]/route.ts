import {
  handleRemoveCartItem,
  handleUpdateCartItem,
} from "@/shopping-cart/routes/carts.route";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleUpdateCartItem(id, request);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleRemoveCartItem(id, request);
}
