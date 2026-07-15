import {
  handleCreateCycleCount,
  handleListCycleCounts,
} from "@/cycle-counts/routes/cycle-counts.route";

export async function GET(request: Request): Promise<Response> {
  return handleListCycleCounts(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleCreateCycleCount(request);
}
