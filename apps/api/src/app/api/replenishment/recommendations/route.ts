import { handleListReplenishmentRecommendations } from "@/replenishment/routes/replenishment.route";

export async function GET(request: Request) {
  return handleListReplenishmentRecommendations(request);
}
