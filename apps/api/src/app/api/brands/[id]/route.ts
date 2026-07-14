import {
  handleDeleteBrand,
  handleGetBrand,
  handleUpdateBrand,
} from "@/catalogue/routes/brands.route";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { id } = await context.params;
  return handleGetBrand(id, request);
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { id } = await context.params;
  return handleUpdateBrand(id, request);
}

export async function DELETE(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { id } = await context.params;
  return handleDeleteBrand(id, request);
}
