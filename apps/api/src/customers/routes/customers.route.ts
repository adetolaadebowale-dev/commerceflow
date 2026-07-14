import {
  createCustomerSchema,
  customerIdQuerySchema,
  listCustomersQuerySchema,
  updateCustomerSchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { CUSTOMER_ERROR_CODES, CustomerError } from "../errors";
import { customerService } from "../services";
import { handleCustomerRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

export async function handleCreateCustomer(
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = createCustomerSchema.safeParse(body);

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
      parsed.data.storeId,
      "customers:write",
    );

    const customer = await customerService.createCustomer(parsed.data);
    auditService.recordFromAuthContext(authContext, {
      entityType: "customer",
      entityId: customer.id,
      action: "create",
      metadata: {
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        status: customer.status,
      },
    });

    return jsonSuccess({ customer }, 201);
  } catch (error) {
    return handleCustomerRouteError(error);
  }
}

export async function handleListCustomers(request: Request): Promise<Response> {
  try {
    const parsed = listCustomersQuerySchema.safeParse(getQueryParams(request));

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

    const result = await customerService.listCustomers(parsed.data);
    return jsonSuccess(result);
  } catch (error) {
    return handleCustomerRouteError(error);
  }
}

export async function handleGetCustomer(
  id: string,
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

    const customer = await customerService.getCustomer(parsed.data.storeId, id);
    return jsonSuccess({ customer });
  } catch (error) {
    return handleCustomerRouteError(error);
  }
}

export async function handleUpdateCustomer(
  id: string,
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
    const parsed = updateCustomerSchema.safeParse(body);

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

    const customer = await customerService.updateCustomer(
      queryParsed.data.storeId,
      id,
      parsed.data,
    );
    auditService.recordFromAuthContext(authContext, {
      entityType: "customer",
      entityId: customer.id,
      action: "update",
      metadata: {
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        status: customer.status,
      },
    });

    return jsonSuccess({ customer });
  } catch (error) {
    return handleCustomerRouteError(error);
  }
}
