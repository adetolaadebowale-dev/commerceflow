import { handleGetApiKey } from "@/api-keys/routes/api-keys.route";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleGetApiKey(id, request);
}
