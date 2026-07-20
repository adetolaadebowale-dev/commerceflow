import type {
  CreateCustomerRequest,
  ListCustomersParams,
  UpdateCustomerRequest,
} from "@commerceflow/api-client";
import type { CatalogueListResult, Customer, Order } from "@commerceflow/types";

import { orderClient, customerClient, toAdminApiError } from "@/services/order-client";

export interface StoreScopedParams {
  readonly storeId: string;
}

export async function listCustomers(
  params: ListCustomersParams,
): Promise<CatalogueListResult<Customer>> {
  try {
    return await customerClient.listCustomers(params);
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function getCustomer(
  id: string,
  params: StoreScopedParams,
): Promise<Customer> {
  try {
    const result = await customerClient.getCustomer(id, params);
    return result.customer;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function createCustomer(
  input: CreateCustomerRequest,
): Promise<Customer> {
  try {
    const result = await customerClient.createCustomer(input);
    return result.customer;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function updateCustomer(
  id: string,
  input: UpdateCustomerRequest,
  params: StoreScopedParams,
): Promise<Customer> {
  try {
    const result = await customerClient.updateCustomer(id, input, params);
    return result.customer;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export function formatCustomerLabel(
  customer: Customer | null | undefined,
  customerId?: string,
): string {
  if (customer) {
    const name = `${customer.firstName} ${customer.lastName}`.trim();
    return name || customer.email;
  }
  if (!customerId) {
    return "Guest";
  }
  return `Customer ${customerId.slice(0, 8)}`;
}

export function formatCustomerFullName(customer: Customer): string {
  const name = `${customer.firstName} ${customer.lastName}`.trim();
  return name || customer.email;
}

/**
 * Recent orders for a store Customer profile.
 *
 * LIMITATION: `GET /api/orders?customerId=` filters Order.customerId (User FK),
 * not customerProfileId. Until the API supports profile filtering, we load a
 * recent page of store orders and filter client-side by customerProfileId.
 * Replace this helper when a backend profile filter exists.
 */
export async function listRecentOrdersForCustomerProfile(params: {
  readonly storeId: string;
  readonly customerProfileId: string;
  readonly limit?: number;
}): Promise<readonly Order[]> {
  try {
    const result = await orderClient.listOrders({
      storeId: params.storeId,
      page: 1,
      limit: 50,
    });
    return result.items
      .filter((order) => order.customerProfileId === params.customerProfileId)
      .slice(0, params.limit ?? 10);
  } catch (error) {
    throw toAdminApiError(error);
  }
}
