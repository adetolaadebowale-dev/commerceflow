import {
  handleGetStoreSettings,
  handleUpdateStoreSettings,
} from "@/store-administration/routes/store-settings.route";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleGetStoreSettings(id, request);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleUpdateStoreSettings(id, request);
}
