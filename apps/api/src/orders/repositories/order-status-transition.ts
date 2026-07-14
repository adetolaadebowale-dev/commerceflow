import type { OrderStatus } from "@commerceflow/types";

export interface OrderStatusTransitionInput {
  readonly fromStatus: OrderStatus;
  readonly toStatus: OrderStatus;
}
