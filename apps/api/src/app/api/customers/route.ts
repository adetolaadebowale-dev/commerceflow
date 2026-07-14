import {
  handleCreateCustomer,
  handleListCustomers,
} from "@/customers/routes/customers.route";

export async function GET(request: Request): Promise<Response> {
  return handleListCustomers(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleCreateCustomer(request);
}
