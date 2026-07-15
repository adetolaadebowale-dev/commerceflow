import { handleCreateInvoice, handleListOrderInvoices } from "@/invoices/routes/invoices.route";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleCreateInvoice(id, request);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleListOrderInvoices(id, request);
}
