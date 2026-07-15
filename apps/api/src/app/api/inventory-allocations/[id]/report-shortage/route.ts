import { handleReportShortage } from "@/inventory-allocation/routes/inventory-allocation.route";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleReportShortage(id, request);
}
