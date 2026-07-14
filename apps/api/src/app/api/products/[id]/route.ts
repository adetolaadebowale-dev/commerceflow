import {
  handleGetProduct,
  handleUpdateProduct,
} from "@/catalogue/routes/products.route";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { id } = await context.params;
  return handleGetProduct(id, request);
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { id } = await context.params;
  return handleUpdateProduct(id, request);
}
