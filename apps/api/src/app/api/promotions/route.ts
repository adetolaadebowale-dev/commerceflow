import {
  handleCreatePromotion,
  handleListPromotions,
} from "@/promotions/routes/promotions.route";

export async function GET(request: Request): Promise<Response> {
  return handleListPromotions(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleCreatePromotion(request);
}
