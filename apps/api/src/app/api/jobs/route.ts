import {
  handleCreateJob,
  handleListJobs,
} from "@/jobs/routes/jobs.route";

export async function GET(request: Request) {
  return handleListJobs(request);
}

export async function POST(request: Request) {
  return handleCreateJob(request);
}
