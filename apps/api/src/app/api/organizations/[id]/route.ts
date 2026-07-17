import {
  handleGetOrganization,
  handleUpdateOrganization,
} from "@/organizations/routes/organizations.route";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleGetOrganization(id, request);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleUpdateOrganization(id, request);
}
