import type { InvoiceStatus } from "./invoice-status";
import type { OrderTaxRateSnapshot } from "../tax-rates/order-tax-rate-snapshot";
import type { OrderShippingMethodSnapshot } from "../shipping-configuration/order-shipping-method-snapshot";

/** Store-scoped financial invoice linked to an order. */
export interface Invoice {
  readonly id: string;
  readonly storeId: string;
  readonly orderId: string;
  readonly invoiceNumber: string;
  readonly status: InvoiceStatus;
  readonly subtotal: string;
  readonly discountAmount?: string;
  readonly taxAmount?: string;
  readonly shippingAmount?: string;
  readonly appliedTaxRate?: OrderTaxRateSnapshot;
  readonly appliedShippingMethod?: OrderShippingMethodSnapshot;
  readonly total: string;
  readonly currency: string;
  readonly issuedAt?: string;
  readonly dueAt?: string;
  readonly paidAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
