import { handleRunIntegrityCheck } from "@/operations/routes/operations.route";

export async function POST(request: Request) {
  return handleRunIntegrityCheck(request);
}
