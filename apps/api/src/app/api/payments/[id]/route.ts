import { handleGetPayment } from "@/payments/routes/payments.route";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleGetPayment(id, request);
}
