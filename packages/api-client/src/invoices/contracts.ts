import type { Invoice } from "@commerceflow/types";
import type {
  CreateInvoiceInput,
  InvoiceIdQuery,
  ListOrderInvoicesQuery,
} from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

export type InvoiceStoreScopedParams = InvoiceIdQuery;
export type ListOrderInvoicesParams = ListOrderInvoicesQuery;
export type CreateInvoiceRequest = CreateInvoiceInput;

export type CreateInvoiceResponse = ApiSuccessResponse<{ invoice: Invoice }>;
export type GetInvoiceResponse = ApiSuccessResponse<{ invoice: Invoice }>;
export type ListOrderInvoicesResponse = ApiSuccessResponse<{
  invoices: readonly Invoice[];
}>;
export type InvoiceActionResponse = ApiSuccessResponse<{ invoice: Invoice }>;
