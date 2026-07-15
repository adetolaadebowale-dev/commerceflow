import { handleGenerateReplenishmentRecommendations } from "@/replenishment/routes/replenishment.route";

export async function POST(request: Request) {
  return handleGenerateReplenishmentRecommendations(request);
}
