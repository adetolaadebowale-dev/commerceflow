import type {
  CreatePaymentRequest,
  CreatePaymentResponse,
  GetPaymentResponse,
  ListOrderPaymentsParams,
  ListOrderPaymentsResponse,
  PaymentActionResponse,
  PaymentStoreScopedParams,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toQueryString(params: PaymentStoreScopedParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export interface PaymentClient {
  createPayment(
    orderId: string,
    input: CreatePaymentRequest,
    params: PaymentStoreScopedParams,
  ): Promise<CreatePaymentResponse["data"]>;
  listOrderPayments(
    orderId: string,
    params: ListOrderPaymentsParams,
  ): Promise<ListOrderPaymentsResponse["data"]>;
  getPayment(
    id: string,
    params: PaymentStoreScopedParams,
  ): Promise<GetPaymentResponse["data"]>;
  authorizePayment(
    id: string,
    params: PaymentStoreScopedParams,
  ): Promise<PaymentActionResponse["data"]>;
  markPaymentPaid(
    id: string,
    params: PaymentStoreScopedParams,
  ): Promise<PaymentActionResponse["data"]>;
  failPayment(
    id: string,
    params: PaymentStoreScopedParams,
  ): Promise<PaymentActionResponse["data"]>;
  cancelPayment(
    id: string,
    params: PaymentStoreScopedParams,
  ): Promise<PaymentActionResponse["data"]>;
}

export function createPaymentClient(config: ApiClientConfig): PaymentClient {
  return {
    createPayment: (orderId, input, params) =>
      apiRequest<CreatePaymentResponse["data"]>(config, {
        method: "POST",
        path: `/api/orders/${orderId}/payments${toQueryString(params)}`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    listOrderPayments: (orderId, params) =>
      apiRequest<ListOrderPaymentsResponse["data"]>(config, {
        method: "GET",
        path: `/api/orders/${orderId}/payments${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getPayment: (id, params) =>
      apiRequest<GetPaymentResponse["data"]>(config, {
        method: "GET",
        path: `/api/payments/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    authorizePayment: (id, params) =>
      apiRequest<PaymentActionResponse["data"]>(config, {
        method: "POST",
        path: `/api/payments/${id}/authorize${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    markPaymentPaid: (id, params) =>
      apiRequest<PaymentActionResponse["data"]>(config, {
        method: "POST",
        path: `/api/payments/${id}/mark-paid${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    failPayment: (id, params) =>
      apiRequest<PaymentActionResponse["data"]>(config, {
        method: "POST",
        path: `/api/payments/${id}/fail${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    cancelPayment: (id, params) =>
      apiRequest<PaymentActionResponse["data"]>(config, {
        method: "POST",
        path: `/api/payments/${id}/cancel${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
