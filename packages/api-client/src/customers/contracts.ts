import type {
  CatalogueListResult,
  Customer,
  CustomerAddress,
} from "@commerceflow/types";
import type {
  CreateCustomerInput,
  CreateCustomerAddressInput,
  ListCustomersQuery,
  UpdateCustomerInput,
  UpdateCustomerAddressInput,
} from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

/** POST /customers */
export type CreateCustomerRequest = CreateCustomerInput;
export type CreateCustomerResponse = ApiSuccessResponse<{ customer: Customer }>;

/** PATCH /customers/:id */
export type UpdateCustomerRequest = UpdateCustomerInput;
export type UpdateCustomerResponse = ApiSuccessResponse<{ customer: Customer }>;

/** GET /customers/:id */
export type GetCustomerResponse = ApiSuccessResponse<{ customer: Customer }>;

/** GET /customers */
export type ListCustomersResponse = ApiSuccessResponse<
  CatalogueListResult<Customer>
>;

/** POST /customers/:id/addresses */
export type CreateCustomerAddressRequest = CreateCustomerAddressInput;
export type CreateCustomerAddressResponse = ApiSuccessResponse<{
  customerAddress: CustomerAddress;
}>;

/** PATCH /customer-addresses/:id */
export type UpdateCustomerAddressRequest = UpdateCustomerAddressInput;
export type UpdateCustomerAddressResponse = ApiSuccessResponse<{
  customerAddress: CustomerAddress;
}>;

/** GET /customer-addresses/:id */
export type GetCustomerAddressResponse = ApiSuccessResponse<{
  customerAddress: CustomerAddress;
}>;

/** GET /customers/:id/addresses */
export type ListCustomerAddressesResponse = ApiSuccessResponse<{
  customerAddresses: readonly CustomerAddress[];
}>;

export interface StoreScopedParams {
  readonly storeId: string;
}

export interface ListCustomersParams extends ListCustomersQuery {}
