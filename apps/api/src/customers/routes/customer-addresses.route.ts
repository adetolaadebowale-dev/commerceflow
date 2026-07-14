import {
  createCustomerAddressSchema,
  customerAddressIdQuerySchema,
  customerIdQuerySchema,
  updateCustomerAddressSchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { CUSTOMER_ERROR_CODES, CustomerError } from "../errors";
import { customerAddressService } from "../services";
import { handleCustomerRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

export async function handleCreateCustomerAddress(
  customerId: string,
  request: Request,
): Promise<Response> {
  try {
    const queryParsed = customerIdQuerySchema.safeParse(getQueryParams(request));

    if (!queryParsed.success) {
      throw new CustomerError(
        CUSTOMER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        queryParsed.error.flatten(),
      );
    }

    const body: unknown = await request.json();
    const parsed = createCustomerAddressSchema.safeParse(body);

    if (!parsed.success) {
      throw new CustomerError(
        CUSTOMER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      queryParsed.data.storeId,
      "customers:write",
    );

    const customerAddress = await customerAddressService.createCustomerAddress(
      queryParsed.data.storeId,
      customerId,
      parsed.data,
    );
    auditService.recordFromAuthContext(authContext, {
      entityType: "customer_address",
      entityId: customerAddress.id,
      action: "create",
      metadata: {
        customerId: customerAddress.customerId,
        label: customerAddress.label,
        isDefault: customerAddress.isDefault,
        countryCode: customerAddress.countryCode,
      },
    });

    return jsonSuccess({ customerAddress }, 201);
  } catch (error) {
    return handleCustomerRouteError(error);
  }
}

export async function handleListCustomerAddresses(
  customerId: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = customerIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new CustomerError(
        CUSTOMER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "customers:read",
    );

    const customerAddresses = await customerAddressService.listCustomerAddresses(
      parsed.data.storeId,
      customerId,
    );

    return jsonSuccess({ customerAddresses });
  } catch (error) {
    return handleCustomerRouteError(error);
  }
}

export async function handleGetCustomerAddress(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = customerAddressIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new CustomerError(
        CUSTOMER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "customers:read",
    );

    const customerAddress = await customerAddressService.getCustomerAddress(
      parsed.data.storeId,
      id,
    );

    return jsonSuccess({ customerAddress });
  } catch (error) {
    return handleCustomerRouteError(error);
  }
}

export async function handleUpdateCustomerAddress(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const queryParsed = customerAddressIdQuerySchema.safeParse(
      getQueryParams(request),
    );

    if (!queryParsed.success) {
      throw new CustomerError(
        CUSTOMER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        queryParsed.error.flatten(),
      );
    }

    const body: unknown = await request.json();
    const parsed = updateCustomerAddressSchema.safeParse(body);

    if (!parsed.success) {
      throw new CustomerError(
        CUSTOMER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      queryParsed.data.storeId,
      "customers:write",
    );

    const customerAddress = await customerAddressService.updateCustomerAddress(
      queryParsed.data.storeId,
      id,
      parsed.data,
    );
    auditService.recordFromAuthContext(authContext, {
      entityType: "customer_address",
      entityId: customerAddress.id,
      action: "update",
      metadata: {
        customerId: customerAddress.customerId,
        label: customerAddress.label,
        isDefault: customerAddress.isDefault,
        countryCode: customerAddress.countryCode,
      },
    });

    return jsonSuccess({ customerAddress });
  } catch (error) {
    return handleCustomerRouteError(error);
  }
}
