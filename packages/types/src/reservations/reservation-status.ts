/** Lifecycle states for inventory reservations. */
export const RESERVATION_STATUSES = ["active", "released"] as const;

export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];
