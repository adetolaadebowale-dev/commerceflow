import {
  createOrderSchema,
  listOrdersQuerySchema,
  orderIdQuerySchema,
  orderStoreActionSchema,
} from "@commerceflow/validation";

import { ORDER_ERROR_CODES, OrderError } from "../errors";
import { orderService } from "../services";
import { handleOrderRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

export async function handleCreateOrder(request: Request): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      throw new OrderError(
        ORDER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const order = await orderService.createOrder(parsed.data);
    return jsonSuccess({ order }, 201);
  } catch (error) {
    return handleOrderRouteError(error);
  }
}

export async function handleListOrders(request: Request): Promise<Response> {
  try {
    const parsed = listOrdersQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new OrderError(
        ORDER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const result = await orderService.listOrders(parsed.data);
    return jsonSuccess(result);
  } catch (error) {
    return handleOrderRouteError(error);
  }
}

export async function handleGetOrder(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = orderIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new OrderError(
        ORDER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const order = await orderService.getOrder(parsed.data.storeId, id);
    return jsonSuccess({ order });
  } catch (error) {
    return handleOrderRouteError(error);
  }
}

export async function handleConfirmOrder(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = orderStoreActionSchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new OrderError(
        ORDER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const order = await orderService.confirmOrder(parsed.data, id);
    return jsonSuccess({ order });
  } catch (error) {
    return handleOrderRouteError(error);
  }
}

export async function handleCancelOrder(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = orderStoreActionSchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new OrderError(
        ORDER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const order = await orderService.cancelOrder(parsed.data, id);
    return jsonSuccess({ order });
  } catch (error) {
    return handleOrderRouteError(error);
  }
}
