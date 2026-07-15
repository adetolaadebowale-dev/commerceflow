import { handleGetFulfillmentDashboard } from "@/operations/routes/operations.route";

export async function GET(request: Request) {
  return handleGetFulfillmentDashboard(request);
}
