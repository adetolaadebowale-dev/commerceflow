import {
  handleCreateWarehouseTransfer,
  handleListWarehouseTransfers,
} from "@/warehouse-transfers/routes/warehouse-transfers.route";

export async function GET(request: Request): Promise<Response> {
  return handleListWarehouseTransfers(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleCreateWarehouseTransfer(request);
}
