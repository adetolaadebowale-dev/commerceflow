import type { InvoiceStatus } from "./invoice-status";

/** Store-scoped financial invoice linked to an order. */
export interface Invoice {
  readonly id: string;
  readonly storeId: string;
  readonly orderId: string;
  readonly invoiceNumber: string;
  readonly status: InvoiceStatus;
  readonly subtotal: string;
  readonly currency: string;
  readonly issuedAt?: string;
  readonly dueAt?: string;
  readonly paidAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
