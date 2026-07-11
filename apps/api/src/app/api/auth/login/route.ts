import { handleLogin } from "@/auth/routes/login.route";

export async function POST(request: Request): Promise<Response> {
  return handleLogin(request);
}
