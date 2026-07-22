import { handleForgotPassword } from "@/auth/routes/forgot-password.route";

export async function POST(request: Request): Promise<Response> {
  return handleForgotPassword(request);
}
