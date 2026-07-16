import { handleGetReportDashboard } from "@/reports/routes/reports.route";

export async function GET(request: Request) {
  return handleGetReportDashboard(request);
}
