import { handleSendTestEmailNotification } from "@/notifications/email/routes/email.route";

export async function POST(request: Request) {
  return handleSendTestEmailNotification(request);
}
