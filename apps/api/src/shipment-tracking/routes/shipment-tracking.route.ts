import {
  createShipmentTrackingEventSchema,
  shipmentTrackingQuerySchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import {
  SHIPMENT_TRACKING_ERROR_CODES,
  ShipmentTrackingError,
} from "../errors";
import { shipmentTrackingService } from "../services";
import { handleShipmentTrackingRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

export async function handleCreateTrackingEvent(
  shipmentId: string,
  request: Request,
): Promise<Response> {
  try {
    const queryParsed = shipmentTrackingQuerySchema.safeParse(
      getQueryParams(request),
    );

    if (!queryParsed.success) {
      throw new ShipmentTrackingError(
        SHIPMENT_TRACKING_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        queryParsed.error.flatten(),
      );
    }

    const body: unknown = await request.json().catch(() => ({}));
    const parsed = createShipmentTrackingEventSchema.safeParse(body);

    if (!parsed.success) {
      throw new ShipmentTrackingError(
        SHIPMENT_TRACKING_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      queryParsed.data.storeId,
      "shipments:write",
    );

    const trackingEvent = await shipmentTrackingService.createTrackingEvent(
      queryParsed.data.storeId,
      shipmentId,
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "shipment_tracking_event",
      entityId: trackingEvent.id,
      action: "create",
      metadata: {
        shipmentId: trackingEvent.shipmentId,
        eventType: trackingEvent.eventType,
        statusSnapshot: trackingEvent.statusSnapshot,
        description: trackingEvent.description,
      },
    });

    return jsonSuccess({ trackingEvent }, 201);
  } catch (error) {
    return handleShipmentTrackingRouteError(error);
  }
}

export async function handleListTrackingEvents(
  shipmentId: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = shipmentTrackingQuerySchema.safeParse(
      getQueryParams(request),
    );

    if (!parsed.success) {
      throw new ShipmentTrackingError(
        SHIPMENT_TRACKING_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "shipments:read",
    );

    const trackingEvents = await shipmentTrackingService.listTrackingEvents(
      parsed.data,
      shipmentId,
    );

    return jsonSuccess({ trackingEvents });
  } catch (error) {
    return handleShipmentTrackingRouteError(error);
  }
}
