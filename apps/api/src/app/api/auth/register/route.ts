import { handleRegister } from "@/auth/routes/register.route";

export async function POST(request: Request): Promise<Response> {
  return handleRegister(request);
}
