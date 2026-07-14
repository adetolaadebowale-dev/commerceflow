import {
  handleCreateCustomerAddress,
  handleListCustomerAddresses,
} from "@/customers/routes/customer-addresses.route";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleListCustomerAddresses(id, request);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleCreateCustomerAddress(id, request);
}
