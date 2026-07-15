import { handleAcceptReplenishmentRecommendation } from "@/replenishment/routes/replenishment.route";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return handleAcceptReplenishmentRecommendation(id, request);
}
