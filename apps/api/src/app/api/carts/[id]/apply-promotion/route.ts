import { handleApplyCartPromotion } from "@/promotion-redemption/routes/promotion-redemption.route";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleApplyCartPromotion(id, request);
}
