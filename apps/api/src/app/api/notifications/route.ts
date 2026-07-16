import {
  handleCreateNotification,
  handleListNotifications,
} from "@/notifications/routes/notifications.route";

export async function GET(request: Request) {
  return handleListNotifications(request);
}

export async function POST(request: Request) {
  return handleCreateNotification(request);
}

export { handleGetNotification } from "@/notifications/routes/notifications.route";
