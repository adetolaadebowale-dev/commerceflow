import type {
  CreateCustomerRequest,
  CreateCustomerResponse,
  CreateCustomerAddressRequest,
  CreateCustomerAddressResponse,
  GetCustomerAddressResponse,
  GetCustomerResponse,
  ListCustomerAddressesResponse,
  ListCustomersParams,
  ListCustomersResponse,
  StoreScopedParams,
  UpdateCustomerRequest,
  UpdateCustomerResponse,
  UpdateCustomerAddressRequest,
  UpdateCustomerAddressResponse,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toQueryString(
  params: ListCustomersParams | StoreScopedParams,
): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export interface CustomerClient {
  createCustomer(
    input: CreateCustomerRequest,
  ): Promise<CreateCustomerResponse["data"]>;
  updateCustomer(
    id: string,
    input: UpdateCustomerRequest,
    params: StoreScopedParams,
  ): Promise<UpdateCustomerResponse["data"]>;
  getCustomer(
    id: string,
    params: StoreScopedParams,
  ): Promise<GetCustomerResponse["data"]>;
  listCustomers(
    params: ListCustomersParams,
  ): Promise<ListCustomersResponse["data"]>;
  createCustomerAddress(
    customerId: string,
    input: CreateCustomerAddressRequest,
    params: StoreScopedParams,
  ): Promise<CreateCustomerAddressResponse["data"]>;
  updateCustomerAddress(
    id: string,
    input: UpdateCustomerAddressRequest,
    params: StoreScopedParams,
  ): Promise<UpdateCustomerAddressResponse["data"]>;
  getCustomerAddress(
    id: string,
    params: StoreScopedParams,
  ): Promise<GetCustomerAddressResponse["data"]>;
  listCustomerAddresses(
    customerId: string,
    params: StoreScopedParams,
  ): Promise<ListCustomerAddressesResponse["data"]>;
}

export function createCustomerClient(config: ApiClientConfig): CustomerClient {
  return {
    createCustomer: (input) =>
      apiRequest<CreateCustomerResponse["data"]>(config, {
        method: "POST",
        path: "/api/customers",
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    updateCustomer: (id, input, params) =>
      apiRequest<UpdateCustomerResponse["data"]>(config, {
        method: "PATCH",
        path: `/api/customers/${id}${toQueryString(params)}`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    getCustomer: (id, params) =>
      apiRequest<GetCustomerResponse["data"]>(config, {
        method: "GET",
        path: `/api/customers/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    listCustomers: (params) =>
      apiRequest<ListCustomersResponse["data"]>(config, {
        method: "GET",
        path: `/api/customers${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    createCustomerAddress: (customerId, input, params) =>
      apiRequest<CreateCustomerAddressResponse["data"]>(config, {
        method: "POST",
        path: `/api/customers/${customerId}/addresses${toQueryString(params)}`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    updateCustomerAddress: (id, input, params) =>
      apiRequest<UpdateCustomerAddressResponse["data"]>(config, {
        method: "PATCH",
        path: `/api/customer-addresses/${id}${toQueryString(params)}`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    getCustomerAddress: (id, params) =>
      apiRequest<GetCustomerAddressResponse["data"]>(config, {
        method: "GET",
        path: `/api/customer-addresses/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    listCustomerAddresses: (customerId, params) =>
      apiRequest<ListCustomerAddressesResponse["data"]>(config, {
        method: "GET",
        path: `/api/customers/${customerId}/addresses${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
