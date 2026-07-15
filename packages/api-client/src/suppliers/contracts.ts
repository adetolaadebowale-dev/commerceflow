import type {
  CatalogueListResult,
  Supplier,
  SupplierContact,
} from "@commerceflow/types";
import type {
  CreateSupplierContactInput,
  CreateSupplierInput,
  ListSuppliersQuery,
  UpdateSupplierContactInput,
  UpdateSupplierInput,
} from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

/** POST /suppliers */
export type CreateSupplierRequest = CreateSupplierInput;
export type CreateSupplierResponse = ApiSuccessResponse<{ supplier: Supplier }>;

/** PATCH /suppliers/:id */
export type UpdateSupplierRequest = UpdateSupplierInput;
export type UpdateSupplierResponse = ApiSuccessResponse<{ supplier: Supplier }>;

/** GET /suppliers/:id */
export type GetSupplierResponse = ApiSuccessResponse<{ supplier: Supplier }>;

/** DELETE /suppliers/:id */
export type DeleteSupplierResponse = ApiSuccessResponse<{ supplier: Supplier }>;

/** GET /suppliers */
export type ListSuppliersParams = ListSuppliersQuery;
export type ListSuppliersResponse = ApiSuccessResponse<
  CatalogueListResult<Supplier>
>;

export type SupplierStoreScopedParams = Pick<ListSuppliersQuery, "storeId">;

/** POST /suppliers/:id/contacts */
export type CreateSupplierContactRequest = CreateSupplierContactInput;
export type CreateSupplierContactResponse = ApiSuccessResponse<{
  contact: SupplierContact;
}>;

/** PATCH /supplier-contacts/:id */
export type UpdateSupplierContactRequest = UpdateSupplierContactInput;
export type UpdateSupplierContactResponse = ApiSuccessResponse<{
  contact: SupplierContact;
}>;

/** DELETE /supplier-contacts/:id */
export type DeleteSupplierContactResponse = ApiSuccessResponse<{
  contact: SupplierContact;
}>;

export type SupplierContactStoreScopedParams = Pick<
  CreateSupplierContactInput,
  "storeId"
>;
