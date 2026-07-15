import type { InvoiceStatus } from "@commerceflow/types";

export interface CreateInvoiceRecord {
  readonly storeId: string;
  readonly orderId: string;
  readonly subtotal: string;
  readonly currency: string;
  readonly dueAt?: string;
}

export interface InvoiceStatusTransitionInput {
  readonly fromStatus: InvoiceStatus;
  readonly toStatus: InvoiceStatus;
  readonly issuedAt?: string;
  readonly paidAt?: string;
}
