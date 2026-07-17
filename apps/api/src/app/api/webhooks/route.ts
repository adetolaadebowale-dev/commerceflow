import {
  handleCreateWebhook,
  handleListWebhooks,
} from "@/webhooks/routes/webhooks.route";

export async function GET(request: Request): Promise<Response> {
  return handleListWebhooks(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleCreateWebhook(request);
}
