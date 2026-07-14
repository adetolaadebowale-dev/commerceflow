import type { OrderStatus } from "@commerceflow/types";

/**
 * Allowed order status transitions for Sprint 4.1 lifecycle management.
 *
 * - draft → confirmed: customer commitment without payment/shipping
 * - draft → cancelled: abandon before confirmation
 * - confirmed → cancelled: void before fulfillment (permitted pre-fulfillment sprint scope)
 * - cancelled: terminal — no further transitions
 */
const ALLOWED_TRANSITIONS: Readonly<
  Record<OrderStatus, readonly OrderStatus[]>
> = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["cancelled"],
  cancelled: [],
};

export const OrderStatusTransitionPolicy = {
  allowedTargets(from: OrderStatus): readonly OrderStatus[] {
    return ALLOWED_TRANSITIONS[from];
  },

  canTransition(from: OrderStatus, to: OrderStatus): boolean {
    return ALLOWED_TRANSITIONS[from].includes(to);
  },
} as const;
