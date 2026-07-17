import { handleUpsertFeatureFlag } from "@/feature-flags/routes/feature-flags.route";

export async function PUT(
  request: Request,
  context: { params: Promise<{ key: string }> },
): Promise<Response> {
  const { key } = await context.params;
  return handleUpsertFeatureFlag(key, request);
}
