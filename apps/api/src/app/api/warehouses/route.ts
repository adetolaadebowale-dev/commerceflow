import {
  handleActivateWarehouse,
  handleCreateWarehouse,
  handleDeactivateWarehouse,
  handleDeleteWarehouse,
  handleGetWarehouse,
  handleListWarehouses,
  handleUpdateWarehouse,
} from "@/warehouses/routes/warehouses.route";

export async function GET(request: Request) {
  return handleListWarehouses(request);
}

export async function POST(request: Request) {
  return handleCreateWarehouse(request);
}

export {
  handleGetWarehouse,
  handleUpdateWarehouse,
  handleDeleteWarehouse,
  handleActivateWarehouse,
  handleDeactivateWarehouse,
};
