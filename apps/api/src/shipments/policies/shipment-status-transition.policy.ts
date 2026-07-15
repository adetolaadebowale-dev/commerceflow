import type { ShipmentStatus } from "@commerceflow/types";

/**
 * Allowed shipment status transitions for Sprint 7.2.
 *
 * - pending → packed | cancelled
 * - packed → shipped | cancelled
 * - shipped → delivered
 * - delivered | cancelled: terminal
 */
const ALLOWED_TRANSITIONS: Readonly<
  Record<ShipmentStatus, readonly ShipmentStatus[]>
> = {
  pending: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export const ShipmentStatusTransitionPolicy = {
  allowedTargets(from: ShipmentStatus): readonly ShipmentStatus[] {
    return ALLOWED_TRANSITIONS[from];
  },

  canTransition(from: ShipmentStatus, to: ShipmentStatus): boolean {
    return ALLOWED_TRANSITIONS[from].includes(to);
  },
} as const;
