import { handleRunPhase3Validation } from "@/operations/routes/operations.route";

export async function POST(request: Request) {
  return handleRunPhase3Validation(request);
}
