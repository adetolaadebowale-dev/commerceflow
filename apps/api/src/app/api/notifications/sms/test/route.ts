import { handleSendTestSmsNotification } from "@/notifications/sms/routes/sms.route";

export async function POST(request: Request) {
  return handleSendTestSmsNotification(request);
}
