import {
  handleCreateTrackingEvent,
  handleListTrackingEvents,
} from "@/shipment-tracking/routes/shipment-tracking.route";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleCreateTrackingEvent(id, request);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleListTrackingEvents(id, request);
}
