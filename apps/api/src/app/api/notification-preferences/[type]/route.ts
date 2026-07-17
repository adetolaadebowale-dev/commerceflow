import { handleUpdateNotificationPreference } from "@/notification-preferences/routes/notification-preferences.route";

export async function PUT(
  request: Request,
  context: { params: Promise<{ type: string }> },
): Promise<Response> {
  const { type } = await context.params;
  return handleUpdateNotificationPreference(type, request);
}
