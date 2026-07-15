import { handleGetInvoice } from "@/invoices/routes/invoices.route";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleGetInvoice(id, request);
}
