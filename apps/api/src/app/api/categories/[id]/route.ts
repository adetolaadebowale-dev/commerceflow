import {
  handleGetCategory,
  handleUpdateCategory,
} from "@/catalogue/routes/categories.route";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { id } = await context.params;
  return handleGetCategory(id, request);
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { id } = await context.params;
  return handleUpdateCategory(id, request);
}
