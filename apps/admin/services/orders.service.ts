import type { ListOrdersParams } from "@commerceflow/api-client";
import type {
  CatalogueListResult,
  InventoryReservation,
  Order,
  OrderFulfillmentResult,
} from "@commerceflow/types";

import {
  formatCustomerLabel,
  getCustomer,
  listCustomers,
} from "@/services/customers.service";
import { fulfillmentClient } from "@/services/inventory-client";
import {
  orderClient,
  reservationClient,
  toAdminApiError,
} from "@/services/order-client";

export interface StoreScopedParams {
  readonly storeId: string;
}

export { formatCustomerLabel, getCustomer, listCustomers };

export async function listOrders(
  params: ListOrdersParams,
): Promise<CatalogueListResult<Order>> {
  try {
    return await orderClient.listOrders(params);
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function getOrder(
  id: string,
  params: StoreScopedParams,
): Promise<Order> {
  try {
    const result = await orderClient.getOrder(id, params);
    return result.order;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function confirmOrder(
  id: string,
  params: StoreScopedParams,
): Promise<Order> {
  try {
    const result = await orderClient.confirmOrder(id, params);
    return result.order;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function cancelOrder(
  id: string,
  params: StoreScopedParams,
): Promise<Order> {
  try {
    const result = await orderClient.cancelOrder(id, params);
    return result.order;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function fulfillOrder(
  id: string,
  params: StoreScopedParams,
): Promise<OrderFulfillmentResult> {
  try {
    return await fulfillmentClient.fulfillOrder(id, params);
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function listOrderReservations(
  orderId: string,
  params: StoreScopedParams,
): Promise<readonly InventoryReservation[]> {
  try {
    const result = await reservationClient.listOrderReservations(
      orderId,
      params,
    );
    return result.reservations;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function reserveOrder(
  orderId: string,
  params: StoreScopedParams & { readonly warehouseId?: string },
): Promise<readonly InventoryReservation[]> {
  try {
    const result = await reservationClient.reserveOrder(orderId, params);
    return result.reservations;
  } catch (error) {
    throw toAdminApiError(error);
  }
}
