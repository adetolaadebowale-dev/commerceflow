import { handleListOrderReservations } from "@/reservations/routes/reservations.route";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { id } = await context.params;
  return handleListOrderReservations(id, request);
}
