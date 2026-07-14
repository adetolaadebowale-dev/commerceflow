import {
  handleCreateInventoryItem,
  handleListInventoryItems,
} from "@/inventory/routes/inventory-items.route";

export async function GET(request: Request): Promise<Response> {
  return handleListInventoryItems(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleCreateInventoryItem(request);
}
