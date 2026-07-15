import {
  handleCreateShippingMethod,
  handleListShippingMethods,
} from "@/shipping-configuration/routes/shipping-methods.route";

export async function GET(request: Request): Promise<Response> {
  return handleListShippingMethods(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleCreateShippingMethod(request);
}
