import { handleGetJob } from "@/jobs/routes/jobs.route";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return handleGetJob(id, request);
}
