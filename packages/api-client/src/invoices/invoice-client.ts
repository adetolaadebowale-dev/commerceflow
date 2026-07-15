import type {
  CreateInvoiceRequest,
  CreateInvoiceResponse,
  GetInvoiceResponse,
  InvoiceActionResponse,
  InvoiceStoreScopedParams,
  ListOrderInvoicesParams,
  ListOrderInvoicesResponse,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toQueryString(params: InvoiceStoreScopedParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export interface InvoiceClient {
  createInvoice(
    orderId: string,
    input: CreateInvoiceRequest,
    params: InvoiceStoreScopedParams,
  ): Promise<CreateInvoiceResponse["data"]>;
  listOrderInvoices(
    orderId: string,
    params: ListOrderInvoicesParams,
  ): Promise<ListOrderInvoicesResponse["data"]>;
  getInvoice(
    id: string,
    params: InvoiceStoreScopedParams,
  ): Promise<GetInvoiceResponse["data"]>;
  issueInvoice(
    id: string,
    params: InvoiceStoreScopedParams,
  ): Promise<InvoiceActionResponse["data"]>;
  markInvoicePaid(
    id: string,
    params: InvoiceStoreScopedParams,
  ): Promise<InvoiceActionResponse["data"]>;
  voidInvoice(
    id: string,
    params: InvoiceStoreScopedParams,
  ): Promise<InvoiceActionResponse["data"]>;
}

export function createInvoiceClient(config: ApiClientConfig): InvoiceClient {
  return {
    createInvoice: (orderId, input, params) =>
      apiRequest<CreateInvoiceResponse["data"]>(config, {
        method: "POST",
        path: `/api/orders/${orderId}/invoices${toQueryString(params)}`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    listOrderInvoices: (orderId, params) =>
      apiRequest<ListOrderInvoicesResponse["data"]>(config, {
        method: "GET",
        path: `/api/orders/${orderId}/invoices${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getInvoice: (id, params) =>
      apiRequest<GetInvoiceResponse["data"]>(config, {
        method: "GET",
        path: `/api/invoices/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    issueInvoice: (id, params) =>
      apiRequest<InvoiceActionResponse["data"]>(config, {
        method: "POST",
        path: `/api/invoices/${id}/issue${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    markInvoicePaid: (id, params) =>
      apiRequest<InvoiceActionResponse["data"]>(config, {
        method: "POST",
        path: `/api/invoices/${id}/mark-paid${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    voidInvoice: (id, params) =>
      apiRequest<InvoiceActionResponse["data"]>(config, {
        method: "POST",
        path: `/api/invoices/${id}/void${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
