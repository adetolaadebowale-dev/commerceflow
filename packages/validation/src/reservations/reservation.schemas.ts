import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

export const orderReservationActionSchema = z.object({
  storeId: storeIdSchema,
});

export const reservationIdActionSchema = z.object({
  storeId: storeIdSchema,
});

export const listOrderReservationsQuerySchema = orderReservationActionSchema;

export type OrderReservationActionQuery = z.infer<
  typeof orderReservationActionSchema
>;
export type ReservationIdActionQuery = z.infer<
  typeof reservationIdActionSchema
>;
export type ListOrderReservationsQuery = z.infer<
  typeof listOrderReservationsQuerySchema
>;
