import {
  listOrderReservationsQuerySchema,
  orderReservationActionSchema,
  reservationIdActionSchema,
} from "@commerceflow/validation";

import { authorizationService } from "@/authorization/services";
import { RESERVATION_ERROR_CODES, ReservationError } from "../errors";
import { reservationService } from "../services";
import { handleReservationRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

export async function handleReserveOrder(
  orderId: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = orderReservationActionSchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new ReservationError(
        RESERVATION_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "reservations:manage",
    );

    const reservations = await reservationService.reserveOrder(
      parsed.data,
      orderId,
    );

    return jsonSuccess({ reservations }, 201);
  } catch (error) {
    return handleReservationRouteError(error);
  }
}

export async function handleReleaseReservation(
  reservationId: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = reservationIdActionSchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new ReservationError(
        RESERVATION_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "reservations:manage",
    );

    const reservation = await reservationService.releaseReservation(
      parsed.data,
      reservationId,
    );

    return jsonSuccess({ reservation });
  } catch (error) {
    return handleReservationRouteError(error);
  }
}

export async function handleListOrderReservations(
  orderId: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = listOrderReservationsQuerySchema.safeParse(
      getQueryParams(request),
    );

    if (!parsed.success) {
      throw new ReservationError(
        RESERVATION_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "reservations:manage",
    );

    const reservations = await reservationService.listOrderReservations(
      parsed.data,
      orderId,
    );

    return jsonSuccess({ reservations });
  } catch (error) {
    return handleReservationRouteError(error);
  }
}
