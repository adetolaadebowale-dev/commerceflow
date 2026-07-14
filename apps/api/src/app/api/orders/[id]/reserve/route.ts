import { handleReserveOrder } from "@/reservations/routes/reservations.route";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { id } = await context.params;
  return handleReserveOrder(id, request);
}
