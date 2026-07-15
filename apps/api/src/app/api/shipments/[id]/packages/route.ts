import {
  handleCreatePackage,
  handleListPackages,
} from "@/shipment-packages/routes/shipment-packages.route";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleCreatePackage(id, request);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleListPackages(id, request);
}
