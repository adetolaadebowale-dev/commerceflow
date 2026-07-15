import { handleGetReadinessReport } from "@/operations/routes/operations.route";

export async function GET(request: Request) {
  return handleGetReadinessReport(request);
}
