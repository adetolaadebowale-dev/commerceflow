import type { Supplier, SupplierContact } from "@commerceflow/types";
import type { CatalogueListResult } from "@commerceflow/types";
import type {
  CreateSupplierContactInput,
  CreateSupplierInput,
  ListSuppliersQuery,
  UpdateSupplierContactInput,
  UpdateSupplierInput,
} from "@commerceflow/validation";

export interface SupplierRepository {
  findById(storeId: string, id: string): Promise<Supplier | null>;
  list(query: ListSuppliersQuery): Promise<CatalogueListResult<Supplier>>;
  create(input: CreateSupplierInput): Promise<Supplier>;
  update(
    storeId: string,
    id: string,
    input: UpdateSupplierInput,
  ): Promise<Supplier>;
  softDelete(storeId: string, id: string): Promise<Supplier>;
  findContactById(
    storeId: string,
    contactId: string,
  ): Promise<SupplierContact | null>;
  createContact(
    storeId: string,
    supplierId: string,
    input: CreateSupplierContactInput,
  ): Promise<SupplierContact>;
  updateContact(
    storeId: string,
    contactId: string,
    input: UpdateSupplierContactInput,
  ): Promise<SupplierContact>;
  deleteContact(storeId: string, contactId: string): Promise<SupplierContact>;
}
