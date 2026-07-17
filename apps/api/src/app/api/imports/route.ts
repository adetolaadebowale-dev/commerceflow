import {
  handleCreateImportJob,
  handleListImportJobs,
} from "@/data-transfer/routes/data-transfer.route";

export async function GET(request: Request): Promise<Response> {
  return handleListImportJobs(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleCreateImportJob(request);
}
