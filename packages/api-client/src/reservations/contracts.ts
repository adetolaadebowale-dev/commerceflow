import type { InventoryReservation } from "@commerceflow/types";
import type {
  ListOrderReservationsQuery,
  OrderReservationActionQuery,
  ReservationIdActionQuery,
} from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

/** POST /orders/:id/reserve */
export type ReserveOrderRequest = OrderReservationActionQuery;
export type ReserveOrderResponse = ApiSuccessResponse<{
  reservations: readonly InventoryReservation[];
}>;

/** POST /reservations/:id/release */
export type ReleaseReservationRequest = ReservationIdActionQuery;
export type ReleaseReservationResponse = ApiSuccessResponse<{
  reservation: InventoryReservation;
}>;

/** GET /orders/:id/reservations */
export type ListOrderReservationsParams = ListOrderReservationsQuery;
export type ListOrderReservationsResponse = ApiSuccessResponse<{
  reservations: readonly InventoryReservation[];
}>;

export type {
  ListOrderReservationsQuery,
  OrderReservationActionQuery,
  ReservationIdActionQuery,
};
