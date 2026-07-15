import {
  handleActivateWarehouse,
  handleDeactivateWarehouse,
  handleDeleteWarehouse,
  handleGetWarehouse,
  handleUpdateWarehouse,
} from "@/warehouses/routes/warehouses.route";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return handleGetWarehouse(id, request);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return handleUpdateWarehouse(id, request);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return handleDeleteWarehouse(id, request);
}

export {
  handleActivateWarehouse,
  handleDeactivateWarehouse,
};
