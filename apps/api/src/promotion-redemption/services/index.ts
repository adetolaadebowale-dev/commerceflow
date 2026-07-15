export {
  PromotionRedemptionService,
  promotionRedemptionService,
  calculatePromotionDiscountFromSnapshot,
} from "./promotion-redemption.service";
export type { PromotionRedemptionServiceDependencies } from "./promotion-redemption.service";

import { promotionRedemptionService } from "./promotion-redemption.service";

export function getPromotionRedemptionService() {
  return promotionRedemptionService;
}
