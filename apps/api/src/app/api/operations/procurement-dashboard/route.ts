import { handleGetProcurementDashboard } from "@/operations/routes/operations.route";

export async function GET(request: Request) {
  return handleGetProcurementDashboard(request);
}
