import { handleRunWarehouseValidation } from "@/operations/routes/operations.route";

export async function POST(request: Request) {
  return handleRunWarehouseValidation(request);
}
