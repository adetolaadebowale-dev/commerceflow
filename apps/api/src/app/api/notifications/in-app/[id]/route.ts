import { handleGetInAppNotification } from "@/notifications/in-app/routes/in-app.route";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return handleGetInAppNotification(id, request);
}
