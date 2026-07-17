import { handleListFeatureFlags } from "@/feature-flags/routes/feature-flags.route";

export async function GET(request: Request): Promise<Response> {
  return handleListFeatureFlags(request);
}
