import type { WarehouseStatus } from "./warehouse-status";

/** Store-scoped physical warehouse location. */
export interface Warehouse {
  readonly id: string;
  readonly storeId: string;
  readonly name: string;
  readonly code: string;
  readonly address: string;
  readonly city: string;
  readonly stateProvince: string;
  readonly postalCode: string;
  readonly countryCode: string;
  readonly status: WarehouseStatus;
  readonly isDefault: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}
