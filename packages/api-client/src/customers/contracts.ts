import type { CatalogueListResult, Customer } from "@commerceflow/types";
import type {
  CreateCustomerInput,
  ListCustomersQuery,
  UpdateCustomerInput,
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

export interface StoreScopedParams {
  readonly storeId: string;
}

export interface ListCustomersParams extends ListCustomersQuery {}
