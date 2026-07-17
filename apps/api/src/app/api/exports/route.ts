import {
  handleCreateExportJob,
  handleListExportJobs,
} from "@/data-transfer/routes/data-transfer.route";

export async function GET(request: Request): Promise<Response> {
  return handleListExportJobs(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleCreateExportJob(request);
}
