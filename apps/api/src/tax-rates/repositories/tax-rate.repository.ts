import type { TaxRate } from "@commerceflow/types";
import type {
  CreateTaxRateInput,
  ListTaxRatesQuery,
  UpdateTaxRateInput,
} from "@commerceflow/validation";
import type { CatalogueListResult } from "@commerceflow/types";

export interface TaxRateRepository {
  findById(storeId: string, id: string): Promise<TaxRate | null>;
  findActiveByStoreId(storeId: string): Promise<TaxRate | null>;
  list(query: ListTaxRatesQuery): Promise<CatalogueListResult<TaxRate>>;
  create(input: CreateTaxRateInput): Promise<TaxRate>;
  update(
    storeId: string,
    id: string,
    input: UpdateTaxRateInput,
  ): Promise<TaxRate>;
  activate(storeId: string, id: string): Promise<TaxRate>;
  deactivate(storeId: string, id: string): Promise<TaxRate>;
  softDelete(storeId: string, id: string): Promise<TaxRate>;
}
