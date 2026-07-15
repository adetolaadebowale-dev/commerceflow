import { handleShipWarehouseTransfer } from "@/warehouse-transfers/routes/warehouse-transfers.route";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleShipWarehouseTransfer(id, request);
}
