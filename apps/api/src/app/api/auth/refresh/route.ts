import { handleRefresh } from "@/auth/routes/refresh.route";

export async function POST(request: Request): Promise<Response> {
  return handleRefresh(request);
}
