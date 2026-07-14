import type { CatalogueListResult, Customer } from "@commerceflow/types";
import type {
  CreateCustomerInput,
  ListCustomersQuery,
  UpdateCustomerInput,
} from "@commerceflow/validation";

export interface CustomerRepository {
  findById(storeId: string, id: string): Promise<Customer | null>;
  findByEmail(storeId: string, email: string): Promise<Customer | null>;
  list(query: ListCustomersQuery): Promise<CatalogueListResult<Customer>>;
  create(input: CreateCustomerInput): Promise<Customer>;
  update(
    storeId: string,
    id: string,
    input: UpdateCustomerInput,
  ): Promise<Customer>;
  softDelete(storeId: string, id: string): Promise<Customer>;
}
