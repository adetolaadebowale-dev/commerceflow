import type { CustomerStatus } from "./customer-status";

/**
 * Store-scoped customer profile independent of platform User identity.
 */
export interface Customer {
  readonly id: string;
  readonly storeId: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly phone?: string;
  readonly status: CustomerStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}
