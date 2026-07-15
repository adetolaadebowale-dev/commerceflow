import { SHIPMENT_TRACKING_EVENT_TYPES } from "@commerceflow/types";
import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");
const metadataSchema = z.record(z.string(), z.unknown()).optional();

export const createShipmentTrackingEventSchema = z.object({
  eventType: z.enum(SHIPMENT_TRACKING_EVENT_TYPES, {
    message: "Event type must be a valid shipment tracking event type",
  }),
  description: z.string().trim().min(1, "Description is required"),
  location: z.string().trim().min(1).optional(),
  metadata: metadataSchema,
});

export const shipmentTrackingQuerySchema = z.object({
  storeId: storeIdSchema,
});

export type CreateShipmentTrackingEventInput = z.infer<
  typeof createShipmentTrackingEventSchema
>;
export type ShipmentTrackingQuery = z.infer<typeof shipmentTrackingQuerySchema>;
