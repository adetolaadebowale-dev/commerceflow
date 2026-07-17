import { handleListWebhookDeliveries } from "@/webhooks/routes/webhooks.route";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleListWebhookDeliveries(id, request);
}
