import {
  handleCreateStockMovement,
  handleListStockMovements,
} from "@/inventory/routes/stock-movements.route";

export async function GET(request: Request): Promise<Response> {
  return handleListStockMovements(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleCreateStockMovement(request);
}
