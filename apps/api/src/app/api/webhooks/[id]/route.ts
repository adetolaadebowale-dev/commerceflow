import { handleGetWebhook, handleUpdateWebhook } from "@/webhooks/routes/webhooks.route";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleGetWebhook(id, request);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleUpdateWebhook(id, request);
}
