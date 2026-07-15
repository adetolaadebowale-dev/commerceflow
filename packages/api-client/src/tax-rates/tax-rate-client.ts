import type {
  ActivateTaxRateResponse,
  CreateTaxRateRequest,
  CreateTaxRateResponse,
  DeactivateTaxRateResponse,
  DeleteTaxRateResponse,
  GetTaxRateResponse,
  ListTaxRatesParams,
  ListTaxRatesResponse,
  TaxRateStoreScopedParams,
  UpdateTaxRateRequest,
  UpdateTaxRateResponse,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toQueryString(params: TaxRateStoreScopedParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toListQueryString(params: ListTaxRatesParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  searchParams.set("page", String(params.page));
  searchParams.set("limit", String(params.limit));

  if (params.status) {
    searchParams.set("status", params.status);
  }

  if (params.search) {
    searchParams.set("search", params.search);
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export interface TaxRateClient {
  createTaxRate(
    input: CreateTaxRateRequest,
  ): Promise<CreateTaxRateResponse["data"]>;
  listTaxRates(
    params: ListTaxRatesParams,
  ): Promise<ListTaxRatesResponse["data"]>;
  getTaxRate(
    id: string,
    params: TaxRateStoreScopedParams,
  ): Promise<GetTaxRateResponse["data"]>;
  updateTaxRate(
    id: string,
    input: UpdateTaxRateRequest,
    params: TaxRateStoreScopedParams,
  ): Promise<UpdateTaxRateResponse["data"]>;
  deleteTaxRate(
    id: string,
    params: TaxRateStoreScopedParams,
  ): Promise<DeleteTaxRateResponse["data"]>;
  activateTaxRate(
    id: string,
    params: TaxRateStoreScopedParams,
  ): Promise<ActivateTaxRateResponse["data"]>;
  deactivateTaxRate(
    id: string,
    params: TaxRateStoreScopedParams,
  ): Promise<DeactivateTaxRateResponse["data"]>;
}

export function createTaxRateClient(config: ApiClientConfig): TaxRateClient {
  return {
    createTaxRate: (input) =>
      apiRequest<CreateTaxRateResponse["data"]>(config, {
        method: "POST",
        path: "/api/tax-rates",
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    listTaxRates: (params) =>
      apiRequest<ListTaxRatesResponse["data"]>(config, {
        method: "GET",
        path: `/api/tax-rates${toListQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getTaxRate: (id, params) =>
      apiRequest<GetTaxRateResponse["data"]>(config, {
        method: "GET",
        path: `/api/tax-rates/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    updateTaxRate: (id, input, params) =>
      apiRequest<UpdateTaxRateResponse["data"]>(config, {
        method: "PATCH",
        path: `/api/tax-rates/${id}${toQueryString(params)}`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    deleteTaxRate: (id, params) =>
      apiRequest<DeleteTaxRateResponse["data"]>(config, {
        method: "DELETE",
        path: `/api/tax-rates/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    activateTaxRate: (id, params) =>
      apiRequest<ActivateTaxRateResponse["data"]>(config, {
        method: "POST",
        path: `/api/tax-rates/${id}/activate${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    deactivateTaxRate: (id, params) =>
      apiRequest<DeactivateTaxRateResponse["data"]>(config, {
        method: "POST",
        path: `/api/tax-rates/${id}/deactivate${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
