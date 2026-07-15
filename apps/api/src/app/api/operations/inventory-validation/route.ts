import { handleRunInventoryValidation } from "@/operations/routes/operations.route";

export async function POST(request: Request) {
  return handleRunInventoryValidation(request);
}
