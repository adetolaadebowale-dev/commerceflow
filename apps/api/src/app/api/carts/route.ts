import { handleCreateCart } from "@/shopping-cart/routes/carts.route";

export async function POST(request: Request): Promise<Response> {
  return handleCreateCart(request);
}
