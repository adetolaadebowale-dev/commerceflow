import { handleFulfillOrder } from "@/fulfillment/routes/fulfillment.route";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { id } = await context.params;
  return handleFulfillOrder(id, request);
}
