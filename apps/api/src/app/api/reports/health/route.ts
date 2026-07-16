import { handleGetReportHealth } from "@/reports/routes/reports.route";

export async function GET(request: Request) {
  return handleGetReportHealth(request);
}
