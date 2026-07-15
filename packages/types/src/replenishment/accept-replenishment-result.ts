import type { PurchaseOrder } from "../purchase-orders/purchase-order";
import type { ReplenishmentRecommendation } from "./replenishment";

/** Result of accepting a replenishment recommendation into procurement. */
export interface AcceptReplenishmentRecommendationResult {
  readonly recommendation: ReplenishmentRecommendation;
  readonly purchaseOrder: PurchaseOrder;
  readonly purchaseOrderCreated: boolean;
}
