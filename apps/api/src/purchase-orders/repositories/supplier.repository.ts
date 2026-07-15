export type SupplierStatus = "active" | "inactive";

export interface SupplierRecord {
  readonly id: string;
  readonly storeId: string;
  readonly name: string;
  readonly code: string;
  readonly status: SupplierStatus;
}

export interface SupplierRepository {
  findById(storeId: string, id: string): Promise<SupplierRecord | null>;
}
