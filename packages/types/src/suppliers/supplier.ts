import type { PaymentTerm } from "./payment-term";
import type { SupplierStatus } from "./supplier-status";

/** Contact person belonging to a supplier. */
export interface SupplierContact {
  readonly id: string;
  readonly supplierId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email?: string;
  readonly phone?: string;
  readonly role?: string;
  readonly isPrimary: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Store-scoped supplier for procurement. */
export interface Supplier {
  readonly id: string;
  readonly storeId: string;
  readonly code: string;
  readonly name: string;
  readonly email?: string;
  readonly phone?: string;
  readonly website?: string;
  readonly taxId?: string;
  readonly paymentTerm: PaymentTerm;
  readonly currency: string;
  readonly status: SupplierStatus;
  readonly notes?: string;
  readonly contacts: readonly SupplierContact[];
  readonly createdAt: string;
  readonly updatedAt: string;
}
