import { handleListInAppNotifications } from "@/notifications/in-app/routes/in-app.route";

export async function GET(request: Request) {
  return handleListInAppNotifications(request);
}
