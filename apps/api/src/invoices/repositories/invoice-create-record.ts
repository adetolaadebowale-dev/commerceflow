import type { InvoiceStatus } from "@commerceflow/types";

import type { OrderTaxRateSnapshot } from "@commerceflow/types";

export interface CreateInvoiceRecord {
  readonly storeId: string;
  readonly orderId: string;
  readonly subtotal: string;
  readonly discountAmount?: string;
  readonly taxAmount?: string;
  readonly appliedTaxRate?: OrderTaxRateSnapshot;
  readonly total: string;
  readonly currency: string;
  readonly dueAt?: string;
}

export interface InvoiceStatusTransitionInput {
  readonly fromStatus: InvoiceStatus;
  readonly toStatus: InvoiceStatus;
  readonly issuedAt?: string;
  readonly paidAt?: string;
}
