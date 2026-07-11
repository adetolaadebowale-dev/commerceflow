import { handleGetMe } from "@/auth/routes/me.route";

export async function GET(request: Request): Promise<Response> {
  return handleGetMe(request);
}
