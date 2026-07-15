import {
  createShippingZoneSchema,
  listShippingZonesQuerySchema,
  shippingZoneIdQuerySchema,
  updateShippingZoneSchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { SHIPPING_ZONE_ERROR_CODES, ShippingZoneError } from "../errors";
import { shippingZoneService } from "../services";
import { handleShippingConfigurationRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

function shippingZoneAuditMetadata(zone: {
  name: string;
  countries: readonly string[];
  status: string;
}) {
  return {
    name: zone.name,
    countries: zone.countries,
    status: zone.status,
  };
}

export async function handleCreateShippingZone(
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = createShippingZoneSchema.safeParse(body);

    if (!parsed.success) {
      throw new ShippingZoneError(
        SHIPPING_ZONE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "shipping-config:write",
    );

    const shippingZone = await shippingZoneService.createShippingZone(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "shipping_zone",
      entityId: shippingZone.id,
      action: "create",
      metadata: shippingZoneAuditMetadata(shippingZone),
    });

    return jsonSuccess({ shippingZone }, 201);
  } catch (error) {
    return handleShippingConfigurationRouteError(error);
  }
}

export async function handleListShippingZones(
  request: Request,
): Promise<Response> {
  try {
    const parsed = listShippingZonesQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new ShippingZoneError(
        SHIPPING_ZONE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "shipping-config:read",
    );

    const result = await shippingZoneService.listShippingZones(parsed.data);
    return jsonSuccess(result);
  } catch (error) {
    return handleShippingConfigurationRouteError(error);
  }
}

export async function handleGetShippingZone(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = shippingZoneIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new ShippingZoneError(
        SHIPPING_ZONE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "shipping-config:read",
    );

    const shippingZone = await shippingZoneService.getShippingZone(
      parsed.data.storeId,
      id,
    );
    return jsonSuccess({ shippingZone });
  } catch (error) {
    return handleShippingConfigurationRouteError(error);
  }
}

export async function handleUpdateShippingZone(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const queryParsed = shippingZoneIdQuerySchema.safeParse(getQueryParams(request));

    if (!queryParsed.success) {
      throw new ShippingZoneError(
        SHIPPING_ZONE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        queryParsed.error.flatten(),
      );
    }

    const body: unknown = await request.json();
    const parsed = updateShippingZoneSchema.safeParse(body);

    if (!parsed.success) {
      throw new ShippingZoneError(
        SHIPPING_ZONE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      queryParsed.data.storeId,
      "shipping-config:write",
    );

    const shippingZone = await shippingZoneService.updateShippingZone(
      queryParsed.data.storeId,
      id,
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "shipping_zone",
      entityId: shippingZone.id,
      action: "update",
      metadata: shippingZoneAuditMetadata(shippingZone),
    });

    return jsonSuccess({ shippingZone });
  } catch (error) {
    return handleShippingConfigurationRouteError(error);
  }
}

export async function handleDeleteShippingZone(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = shippingZoneIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new ShippingZoneError(
        SHIPPING_ZONE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "shipping-config:write",
    );

    const shippingZone = await shippingZoneService.softDeleteShippingZone(
      parsed.data.storeId,
      id,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "shipping_zone",
      entityId: shippingZone.id,
      action: "delete",
      metadata: shippingZoneAuditMetadata(shippingZone),
    });

    return jsonSuccess({ shippingZone });
  } catch (error) {
    return handleShippingConfigurationRouteError(error);
  }
}
