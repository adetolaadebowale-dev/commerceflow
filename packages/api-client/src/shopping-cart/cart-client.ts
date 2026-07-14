import type {
  AddCartItemRequest,
  AddCartItemResponse,
  CreateCartRequest,
  CreateCartResponse,
  GetCartResponse,
  GetCustomerCartResponse,
  RemoveCartItemResponse,
  StoreScopedParams,
  UpdateCartItemRequest,
  UpdateCartItemResponse,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toQueryString(params: StoreScopedParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export interface CartClient {
  createCart(input: CreateCartRequest): Promise<CreateCartResponse["data"]>;
  getCart(
    id: string,
    params: StoreScopedParams,
  ): Promise<GetCartResponse["data"]>;
  getCustomerCart(
    customerId: string,
    params: StoreScopedParams,
  ): Promise<GetCustomerCartResponse["data"]>;
  addCartItem(
    cartId: string,
    input: AddCartItemRequest,
    params: StoreScopedParams,
  ): Promise<AddCartItemResponse["data"]>;
  updateCartItem(
    id: string,
    input: UpdateCartItemRequest,
    params: StoreScopedParams,
  ): Promise<UpdateCartItemResponse["data"]>;
  removeCartItem(
    id: string,
    params: StoreScopedParams,
  ): Promise<RemoveCartItemResponse["data"]>;
}

export function createCartClient(config: ApiClientConfig): CartClient {
  return {
    createCart: (input) =>
      apiRequest<CreateCartResponse["data"]>(config, {
        method: "POST",
        path: "/api/carts",
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    getCart: (id, params) =>
      apiRequest<GetCartResponse["data"]>(config, {
        method: "GET",
        path: `/api/carts/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getCustomerCart: (customerId, params) =>
      apiRequest<GetCustomerCartResponse["data"]>(config, {
        method: "GET",
        path: `/api/customers/${customerId}/cart${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    addCartItem: (cartId, input, params) =>
      apiRequest<AddCartItemResponse["data"]>(config, {
        method: "POST",
        path: `/api/carts/${cartId}/items${toQueryString(params)}`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    updateCartItem: (id, input, params) =>
      apiRequest<UpdateCartItemResponse["data"]>(config, {
        method: "PATCH",
        path: `/api/cart-items/${id}${toQueryString(params)}`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    removeCartItem: (id, params) =>
      apiRequest<RemoveCartItemResponse["data"]>(config, {
        method: "DELETE",
        path: `/api/cart-items/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
