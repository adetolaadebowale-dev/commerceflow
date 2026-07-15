import { handleGetWarehouseTransfer } from "@/warehouse-transfers/routes/warehouse-transfers.route";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleGetWarehouseTransfer(id, request);
}
