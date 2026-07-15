import { handleGetShipment } from "@/shipments/routes/shipments.route";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleGetShipment(id, request);
}
