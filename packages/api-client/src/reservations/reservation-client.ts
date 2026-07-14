import type {
  ListOrderReservationsParams,
  ListOrderReservationsResponse,
  ReleaseReservationRequest,
  ReleaseReservationResponse,
  ReserveOrderRequest,
  ReserveOrderResponse,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toQueryString(params: Record<string, string | undefined>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export interface ReservationClient {
  reserveOrder(
    orderId: string,
    params: ReserveOrderRequest,
  ): Promise<ReserveOrderResponse["data"]>;
  releaseReservation(
    reservationId: string,
    params: ReleaseReservationRequest,
  ): Promise<ReleaseReservationResponse["data"]>;
  listOrderReservations(
    orderId: string,
    params: ListOrderReservationsParams,
  ): Promise<ListOrderReservationsResponse["data"]>;
}

export function createReservationClient(
  config: ApiClientConfig,
): ReservationClient {
  return {
    reserveOrder: (orderId, params) =>
      apiRequest<ReserveOrderResponse["data"]>(config, {
        method: "POST",
        path: `/api/orders/${orderId}/reserve${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    releaseReservation: (reservationId, params) =>
      apiRequest<ReleaseReservationResponse["data"]>(config, {
        method: "POST",
        path: `/api/reservations/${reservationId}/release${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    listOrderReservations: (orderId, params) =>
      apiRequest<ListOrderReservationsResponse["data"]>(config, {
        method: "GET",
        path: `/api/orders/${orderId}/reservations${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
