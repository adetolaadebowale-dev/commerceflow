import { handleGetNotification } from "@/notifications/routes/notifications.route";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return handleGetNotification(id, request);
}
