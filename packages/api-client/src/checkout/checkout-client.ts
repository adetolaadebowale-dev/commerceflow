import type {
  CheckoutCartParams,
  CheckoutCartRequest,
  CheckoutCartResponse,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toQueryString(params: CheckoutCartParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export interface CheckoutClient {
  checkoutCart(
    cartId: string,
    input: CheckoutCartRequest,
    params: CheckoutCartParams,
  ): Promise<CheckoutCartResponse["data"]>;
}

export function createCheckoutClient(config: ApiClientConfig): CheckoutClient {
  return {
    checkoutCart: (cartId, input, params) =>
      apiRequest<CheckoutCartResponse["data"]>(config, {
        method: "POST",
        path: `/api/carts/${cartId}/checkout${toQueryString(params)}`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
