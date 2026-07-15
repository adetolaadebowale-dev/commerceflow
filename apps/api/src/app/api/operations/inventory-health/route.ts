import { handleGetInventoryHealthSummary } from "@/operations/routes/operations.route";

export async function GET(request: Request) {
  return handleGetInventoryHealthSummary(request);
}
