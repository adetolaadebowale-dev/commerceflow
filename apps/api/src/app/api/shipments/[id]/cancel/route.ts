import { handleCancelShipment } from "@/shipments/routes/shipments.route";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleCancelShipment(id, request);
}
