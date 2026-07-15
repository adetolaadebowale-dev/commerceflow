import type { PrismaClient } from "@prisma/client";

import type { SupplierRecord, SupplierRepository } from "./supplier.repository";

export class PrismaSupplierRepository implements SupplierRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(storeId: string, id: string): Promise<SupplierRecord | null> {
    const record = await this.db.supplier.findFirst({
      where: { id, storeId, deletedAt: null },
    });

    if (!record) {
      return null;
    }

    return {
      id: record.id,
      storeId: record.storeId,
      name: record.name,
      code: record.code,
      status: record.status,
    };
  }
}
