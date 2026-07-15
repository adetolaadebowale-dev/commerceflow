import { handleIssueInvoice } from "@/invoices/routes/invoices.route";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleIssueInvoice(id, request);
}
