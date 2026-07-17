import { handleRevokeApiKey } from "@/api-keys/routes/api-keys.route";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleRevokeApiKey(id, request);
}
