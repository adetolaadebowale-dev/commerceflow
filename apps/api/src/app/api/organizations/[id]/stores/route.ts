import { handleListOrganizationStores } from "@/organizations/routes/organizations.route";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleListOrganizationStores(id, request);
}
