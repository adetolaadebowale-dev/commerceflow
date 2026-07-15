import type {
  CreateRefundRequest,
  CreateRefundResponse,
  GetRefundResponse,
  ListPaymentRefundsParams,
  ListPaymentRefundsResponse,
  RefundActionResponse,
  RefundStoreScopedParams,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toQueryString(params: RefundStoreScopedParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export interface RefundClient {
  createRefund(
    paymentId: string,
    input: CreateRefundRequest,
    params: RefundStoreScopedParams,
  ): Promise<CreateRefundResponse["data"]>;
  listPaymentRefunds(
    paymentId: string,
    params: ListPaymentRefundsParams,
  ): Promise<ListPaymentRefundsResponse["data"]>;
  getRefund(
    id: string,
    params: RefundStoreScopedParams,
  ): Promise<GetRefundResponse["data"]>;
  completeRefund(
    id: string,
    params: RefundStoreScopedParams,
  ): Promise<RefundActionResponse["data"]>;
  cancelRefund(
    id: string,
    params: RefundStoreScopedParams,
  ): Promise<RefundActionResponse["data"]>;
}

export function createRefundClient(config: ApiClientConfig): RefundClient {
  return {
    createRefund: (paymentId, input, params) =>
      apiRequest<CreateRefundResponse["data"]>(config, {
        method: "POST",
        path: `/api/payments/${paymentId}/refunds${toQueryString(params)}`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    listPaymentRefunds: (paymentId, params) =>
      apiRequest<ListPaymentRefundsResponse["data"]>(config, {
        method: "GET",
        path: `/api/payments/${paymentId}/refunds${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getRefund: (id, params) =>
      apiRequest<GetRefundResponse["data"]>(config, {
        method: "GET",
        path: `/api/refunds/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    completeRefund: (id, params) =>
      apiRequest<RefundActionResponse["data"]>(config, {
        method: "POST",
        path: `/api/refunds/${id}/complete${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    cancelRefund: (id, params) =>
      apiRequest<RefundActionResponse["data"]>(config, {
        method: "POST",
        path: `/api/refunds/${id}/cancel${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
