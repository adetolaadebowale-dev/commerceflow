import { handleFulfillShipment } from "@/fulfillment/routes/fulfillment.route";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleFulfillShipment(id, request);
}
