import { SHIPMENT_CARRIERS } from "@commerceflow/types";
import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

export const createShipmentSchema = z.object({
  carrier: z.enum(SHIPMENT_CARRIERS, {
    message: "Carrier must be internal or manual",
  }),
  trackingNumber: z.string().trim().min(1).optional(),
});

export const shipmentIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export const orderShipmentActionSchema = shipmentIdQuerySchema;

export const listOrderShipmentsQuerySchema = shipmentIdQuerySchema;

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
export type ShipmentIdQuery = z.infer<typeof shipmentIdQuerySchema>;
export type OrderShipmentActionQuery = z.infer<typeof orderShipmentActionSchema>;
export type ListOrderShipmentsQuery = z.infer<typeof listOrderShipmentsQuerySchema>;
