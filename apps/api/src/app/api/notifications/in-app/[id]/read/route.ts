import { handleMarkInAppNotificationRead } from "@/notifications/in-app/routes/in-app.route";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return handleMarkInAppNotificationRead(id, request);
}
