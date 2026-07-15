import { handleGetCycleCount } from "@/cycle-counts/routes/cycle-counts.route";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleGetCycleCount(id, request);
}
