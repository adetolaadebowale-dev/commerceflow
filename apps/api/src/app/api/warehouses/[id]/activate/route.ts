import { handleActivateWarehouse } from "@/warehouses/routes/warehouses.route";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return handleActivateWarehouse(id, request);
}
