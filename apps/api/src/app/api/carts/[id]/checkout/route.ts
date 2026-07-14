import { handleCheckoutCart } from "@/checkout/routes/checkout.route";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleCheckoutCart(id, request);
}
