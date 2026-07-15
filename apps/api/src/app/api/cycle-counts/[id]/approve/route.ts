import { handleApproveCycleCount } from "@/cycle-counts/routes/cycle-counts.route";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleApproveCycleCount(id, request);
}
