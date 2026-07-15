import type { SupplierRecord, SupplierRepository } from "./supplier.repository";

export class MemorySupplierRepository implements SupplierRepository {
  private readonly suppliersById = new Map<string, SupplierRecord>();

  seedSupplier(supplier: SupplierRecord): void {
    this.suppliersById.set(supplier.id, supplier);
  }

  async findById(storeId: string, id: string): Promise<SupplierRecord | null> {
    const record = this.suppliersById.get(id);
    return record?.storeId === storeId ? record : null;
  }
}
