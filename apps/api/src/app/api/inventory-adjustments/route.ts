import { handleListInventoryAdjustments } from "@/inventory-adjustments/routes/inventory-adjustments.route";
import { handleCreateInventoryAdjustment } from "@/inventory-adjustments/routes/inventory-adjustments.route";

export async function GET(request: Request): Promise<Response> {
  return handleListInventoryAdjustments(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleCreateInventoryAdjustment(request);
}
