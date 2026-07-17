import { handleGetPlatformReadiness } from "@/platform-operations/routes/platform-operations.route";

export async function GET(): Promise<Response> {
  return handleGetPlatformReadiness();
}
