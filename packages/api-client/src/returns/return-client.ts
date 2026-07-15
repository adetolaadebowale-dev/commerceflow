import type {
  Return,
  ReturnCompletionResult,
} from "@commerceflow/types";
import type {
  CompleteReturnInput,
  CreateReturnInput,
  InspectReturnInput,
  ListReturnsQuery,
  ReceiveReturnInput,
  ReturnIdQuery,
} from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toQueryString(
  params: ListReturnsQuery | ReturnIdQuery,
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

export type CreateReturnRequest = CreateReturnInput;
export type CreateReturnResponse = ApiSuccessResponse<{ return: Return }>;
export type ListReturnsParams = ListReturnsQuery;
export type ListReturnsResponse = ApiSuccessResponse<{ returns: readonly Return[] }>;
export type GetReturnParams = ReturnIdQuery;
export type GetReturnResponse = ApiSuccessResponse<{ return: Return }>;
export type ReceiveReturnRequest = ReceiveReturnInput;
export type ReceiveReturnResponse = ApiSuccessResponse<{ return: Return }>;
export type InspectReturnRequest = InspectReturnInput;
export type InspectReturnResponse = ApiSuccessResponse<{ return: Return }>;
export type CompleteReturnRequest = CompleteReturnInput;
export type CompleteReturnResponse = ApiSuccessResponse<{ result: ReturnCompletionResult }>;

export interface ReturnClient {
  createReturn(
    orderId: string,
    input: CreateReturnRequest,
  ): Promise<CreateReturnResponse["data"]>;
  listReturns(
    orderId: string,
    params: ListReturnsParams,
  ): Promise<ListReturnsResponse["data"]>;
  getReturn(
    id: string,
    params: GetReturnParams,
  ): Promise<GetReturnResponse["data"]>;
  receiveReturn(
    id: string,
    input: ReceiveReturnRequest,
  ): Promise<ReceiveReturnResponse["data"]>;
  inspectReturn(
    id: string,
    input: InspectReturnRequest,
  ): Promise<InspectReturnResponse["data"]>;
  completeReturn(
    id: string,
    input: CompleteReturnRequest,
  ): Promise<CompleteReturnResponse["data"]>;
}

export function createReturnClient(config: ApiClientConfig): ReturnClient {
  return {
    createReturn: (orderId, input) =>
      apiRequest<CreateReturnResponse["data"]>(config, {
        method: "POST",
        path: `/api/orders/${orderId}/returns`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    listReturns: (orderId, params) =>
      apiRequest<ListReturnsResponse["data"]>(config, {
        method: "GET",
        path: `/api/orders/${orderId}/returns${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getReturn: (id, params) =>
      apiRequest<GetReturnResponse["data"]>(config, {
        method: "GET",
        path: `/api/returns/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    receiveReturn: (id, input) =>
      apiRequest<ReceiveReturnResponse["data"]>(config, {
        method: "POST",
        path: `/api/returns/${id}/receive`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    inspectReturn: (id, input) =>
      apiRequest<InspectReturnResponse["data"]>(config, {
        method: "POST",
        path: `/api/returns/${id}/inspect`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    completeReturn: (id, input) =>
      apiRequest<CompleteReturnResponse["data"]>(config, {
        method: "POST",
        path: `/api/returns/${id}/complete`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
