import { handleRunJob } from "@/jobs/routes/jobs.route";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return handleRunJob(id, request);
}
