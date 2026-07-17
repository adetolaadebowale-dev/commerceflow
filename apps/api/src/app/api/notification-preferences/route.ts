import { handleListNotificationPreferences } from "@/notification-preferences/routes/notification-preferences.route";

export async function GET(request: Request): Promise<Response> {
  return handleListNotificationPreferences(request);
}
