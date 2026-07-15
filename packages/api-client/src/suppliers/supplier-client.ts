import type {
  CreateSupplierContactRequest,
  CreateSupplierContactResponse,
  CreateSupplierRequest,
  CreateSupplierResponse,
  DeleteSupplierContactResponse,
  DeleteSupplierResponse,
  GetSupplierResponse,
  ListSuppliersParams,
  ListSuppliersResponse,
  SupplierContactStoreScopedParams,
  SupplierStoreScopedParams,
  UpdateSupplierContactRequest,
  UpdateSupplierContactResponse,
  UpdateSupplierRequest,
  UpdateSupplierResponse,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toQueryString(params: SupplierStoreScopedParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toListQueryString(params: ListSuppliersParams): string {
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

export interface SupplierClient {
  createSupplier(
    input: CreateSupplierRequest,
  ): Promise<CreateSupplierResponse["data"]>;
  listSuppliers(
    params: ListSuppliersParams,
  ): Promise<ListSuppliersResponse["data"]>;
  getSupplier(
    id: string,
    params: SupplierStoreScopedParams,
  ): Promise<GetSupplierResponse["data"]>;
  updateSupplier(
    id: string,
    input: UpdateSupplierRequest,
    params: SupplierStoreScopedParams,
  ): Promise<UpdateSupplierResponse["data"]>;
  deleteSupplier(
    id: string,
    params: SupplierStoreScopedParams,
  ): Promise<DeleteSupplierResponse["data"]>;
  createSupplierContact(
    supplierId: string,
    input: CreateSupplierContactRequest,
  ): Promise<CreateSupplierContactResponse["data"]>;
  updateSupplierContact(
    contactId: string,
    input: UpdateSupplierContactRequest,
  ): Promise<UpdateSupplierContactResponse["data"]>;
  deleteSupplierContact(
    contactId: string,
    params: SupplierContactStoreScopedParams,
  ): Promise<DeleteSupplierContactResponse["data"]>;
}

export function createSupplierClient(config: ApiClientConfig): SupplierClient {
  return {
    createSupplier: (input) =>
      apiRequest<CreateSupplierResponse["data"]>(config, {
        method: "POST",
        path: "/api/suppliers",
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    listSuppliers: (params) =>
      apiRequest<ListSuppliersResponse["data"]>(config, {
        method: "GET",
        path: `/api/suppliers${toListQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getSupplier: (id, params) =>
      apiRequest<GetSupplierResponse["data"]>(config, {
        method: "GET",
        path: `/api/suppliers/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    updateSupplier: (id, input, params) =>
      apiRequest<UpdateSupplierResponse["data"]>(config, {
        method: "PATCH",
        path: `/api/suppliers/${id}${toQueryString(params)}`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    deleteSupplier: (id, params) =>
      apiRequest<DeleteSupplierResponse["data"]>(config, {
        method: "DELETE",
        path: `/api/suppliers/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    createSupplierContact: (supplierId, input) =>
      apiRequest<CreateSupplierContactResponse["data"]>(config, {
        method: "POST",
        path: `/api/suppliers/${supplierId}/contacts`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    updateSupplierContact: (contactId, input) =>
      apiRequest<UpdateSupplierContactResponse["data"]>(config, {
        method: "PATCH",
        path: `/api/supplier-contacts/${contactId}`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    deleteSupplierContact: (contactId, params) =>
      apiRequest<DeleteSupplierContactResponse["data"]>(config, {
        method: "DELETE",
        path: `/api/supplier-contacts/${contactId}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
