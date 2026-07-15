import {
  createShippingMethodSchema,
  listShippingMethodsQuerySchema,
  shippingMethodIdQuerySchema,
  updateShippingMethodSchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { SHIPPING_METHOD_ERROR_CODES, ShippingMethodError } from "../errors";
import { shippingMethodService } from "../services";
import { handleShippingConfigurationRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

function shippingMethodAuditMetadata(method: {
  name: string;
  shippingZoneId: string;
  carrier: string;
  flatRate: string;
  currency: string;
  status: string;
}) {
  return {
    name: method.name,
    shippingZoneId: method.shippingZoneId,
    carrier: method.carrier,
    flatRate: method.flatRate,
    currency: method.currency,
    status: method.status,
  };
}

export async function handleCreateShippingMethod(
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = createShippingMethodSchema.safeParse(body);

    if (!parsed.success) {
      throw new ShippingMethodError(
        SHIPPING_METHOD_ERROR_CODES.VALIDATION_ERROR,
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

    const shippingMethod = await shippingMethodService.createShippingMethod(
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "shipping_method",
      entityId: shippingMethod.id,
      action: "create",
      metadata: shippingMethodAuditMetadata(shippingMethod),
    });

    return jsonSuccess({ shippingMethod }, 201);
  } catch (error) {
    return handleShippingConfigurationRouteError(error);
  }
}

export async function handleListShippingMethods(
  request: Request,
): Promise<Response> {
  try {
    const parsed = listShippingMethodsQuerySchema.safeParse(
      getQueryParams(request),
    );

    if (!parsed.success) {
      throw new ShippingMethodError(
        SHIPPING_METHOD_ERROR_CODES.VALIDATION_ERROR,
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

    const result = await shippingMethodService.listShippingMethods(parsed.data);
    return jsonSuccess(result);
  } catch (error) {
    return handleShippingConfigurationRouteError(error);
  }
}

export async function handleGetShippingMethod(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = shippingMethodIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new ShippingMethodError(
        SHIPPING_METHOD_ERROR_CODES.VALIDATION_ERROR,
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

    const shippingMethod = await shippingMethodService.getShippingMethod(
      parsed.data.storeId,
      id,
    );
    return jsonSuccess({ shippingMethod });
  } catch (error) {
    return handleShippingConfigurationRouteError(error);
  }
}

export async function handleUpdateShippingMethod(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const queryParsed = shippingMethodIdQuerySchema.safeParse(
      getQueryParams(request),
    );

    if (!queryParsed.success) {
      throw new ShippingMethodError(
        SHIPPING_METHOD_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        queryParsed.error.flatten(),
      );
    }

    const body: unknown = await request.json();
    const parsed = updateShippingMethodSchema.safeParse(body);

    if (!parsed.success) {
      throw new ShippingMethodError(
        SHIPPING_METHOD_ERROR_CODES.VALIDATION_ERROR,
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

    const shippingMethod = await shippingMethodService.updateShippingMethod(
      queryParsed.data.storeId,
      id,
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "shipping_method",
      entityId: shippingMethod.id,
      action: "update",
      metadata: shippingMethodAuditMetadata(shippingMethod),
    });

    return jsonSuccess({ shippingMethod });
  } catch (error) {
    return handleShippingConfigurationRouteError(error);
  }
}

export async function handleDeleteShippingMethod(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = shippingMethodIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new ShippingMethodError(
        SHIPPING_METHOD_ERROR_CODES.VALIDATION_ERROR,
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

    const shippingMethod = await shippingMethodService.softDeleteShippingMethod(
      parsed.data.storeId,
      id,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "shipping_method",
      entityId: shippingMethod.id,
      action: "delete",
      metadata: shippingMethodAuditMetadata(shippingMethod),
    });

    return jsonSuccess({ shippingMethod });
  } catch (error) {
    return handleShippingConfigurationRouteError(error);
  }
}
