import type { PromotionStatus } from "./promotion-status";
import type { PromotionType } from "./promotion-type";

/** Store-scoped merchant-managed discount promotion. */
export interface Promotion {
  readonly id: string;
  readonly storeId: string;
  readonly name: string;
  readonly code: string;
  readonly description?: string;
  readonly type: PromotionType;
  readonly value: string;
  readonly currency?: string;
  readonly status: PromotionStatus;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
