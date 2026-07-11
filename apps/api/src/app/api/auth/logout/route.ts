import { handleLogout } from "@/auth/routes/logout.route";

export async function POST(request: Request): Promise<Response> {
  return handleLogout(request);
}
