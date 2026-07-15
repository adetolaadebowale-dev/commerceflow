import type {
  CatalogueListResult,
  TaxRate,
} from "@commerceflow/types";
import type {
  CreateTaxRateInput,
  ListTaxRatesQuery,
  UpdateTaxRateInput,
} from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

/** POST /tax-rates */
export type CreateTaxRateRequest = CreateTaxRateInput;
export type CreateTaxRateResponse = ApiSuccessResponse<{ taxRate: TaxRate }>;

/** PATCH /tax-rates/:id */
export type UpdateTaxRateRequest = UpdateTaxRateInput;
export type UpdateTaxRateResponse = ApiSuccessResponse<{ taxRate: TaxRate }>;

/** GET /tax-rates/:id */
export type GetTaxRateResponse = ApiSuccessResponse<{ taxRate: TaxRate }>;

/** DELETE /tax-rates/:id */
export type DeleteTaxRateResponse = ApiSuccessResponse<{ taxRate: TaxRate }>;

/** POST /tax-rates/:id/activate */
export type ActivateTaxRateResponse = ApiSuccessResponse<{ taxRate: TaxRate }>;

/** POST /tax-rates/:id/deactivate */
export type DeactivateTaxRateResponse = ApiSuccessResponse<{ taxRate: TaxRate }>;

/** GET /tax-rates */
export type ListTaxRatesParams = ListTaxRatesQuery;
export type ListTaxRatesResponse = ApiSuccessResponse<
  CatalogueListResult<TaxRate>
>;

export type TaxRateStoreScopedParams = Pick<ListTaxRatesQuery, "storeId">;
