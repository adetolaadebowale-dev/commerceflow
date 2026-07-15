import { handleAuthorizePayment } from "@/payments/routes/payments.route";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleAuthorizePayment(id, request);
}
