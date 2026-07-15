import {
  Prisma,
  type PrismaClient,
  type Supplier as PrismaSupplier,
  type SupplierContact as PrismaSupplierContact,
} from "@prisma/client";
import {
  buildCatalogueListResult,
  type Supplier,
  type SupplierContact,
} from "@commerceflow/types";
import type {
  CreateSupplierContactInput,
  CreateSupplierInput,
  ListSuppliersQuery,
  UpdateSupplierContactInput,
  UpdateSupplierInput,
} from "@commerceflow/validation";

import type { SupplierRepository } from "./supplier.repository";

const contactInclude = {
  contacts: {
    orderBy: [{ isPrimary: "desc" as const }, { createdAt: "asc" as const }],
  },
} satisfies Prisma.SupplierInclude;

function toSupplierContact(record: PrismaSupplierContact): SupplierContact {
  return {
    id: record.id,
    supplierId: record.supplierId,
    firstName: record.firstName,
    lastName: record.lastName,
    email: record.email ?? undefined,
    phone: record.phone ?? undefined,
    role: record.role ?? undefined,
    isPrimary: record.isPrimary,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toSupplier(
  record: PrismaSupplier & { contacts?: PrismaSupplierContact[] },
): Supplier {
  return {
    id: record.id,
    storeId: record.storeId,
    code: record.code,
    name: record.name,
    email: record.email ?? undefined,
    phone: record.phone ?? undefined,
    website: record.website ?? undefined,
    taxId: record.taxId ?? undefined,
    paymentTerm: record.paymentTerm,
    currency: record.currency,
    status: record.status,
    notes: record.notes ?? undefined,
    contacts: (record.contacts ?? []).map(toSupplierContact),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function buildListWhere(query: ListSuppliersQuery): Prisma.SupplierWhereInput {
  return {
    storeId: query.storeId,
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { code: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

function buildCreateData(input: CreateSupplierInput) {
  return {
    storeId: input.storeId,
    code: input.code.trim(),
    name: input.name.trim(),
    email: input.email ?? null,
    phone: input.phone ?? null,
    website: input.website ?? null,
    taxId: input.taxId ?? null,
    paymentTerm: input.paymentTerm,
    currency: input.currency,
    status: input.status,
    notes: input.notes ?? null,
  };
}

function buildUpdateData(input: UpdateSupplierInput) {
  return {
    ...(input.code !== undefined ? { code: input.code.trim() } : {}),
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.email !== undefined ? { email: input.email ?? null } : {}),
    ...(input.phone !== undefined ? { phone: input.phone ?? null } : {}),
    ...(input.website !== undefined ? { website: input.website ?? null } : {}),
    ...(input.taxId !== undefined ? { taxId: input.taxId ?? null } : {}),
    ...(input.paymentTerm !== undefined
      ? { paymentTerm: input.paymentTerm }
      : {}),
    ...(input.currency !== undefined ? { currency: input.currency } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.notes !== undefined ? { notes: input.notes ?? null } : {}),
  };
}

function buildContactCreateData(
  supplierId: string,
  input: CreateSupplierContactInput,
) {
  return {
    supplierId,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: input.email ?? null,
    phone: input.phone ?? null,
    role: input.role ?? null,
    isPrimary: input.isPrimary,
  };
}

function buildContactUpdateData(input: UpdateSupplierContactInput) {
  return {
    ...(input.firstName !== undefined
      ? { firstName: input.firstName.trim() }
      : {}),
    ...(input.lastName !== undefined
      ? { lastName: input.lastName.trim() }
      : {}),
    ...(input.email !== undefined ? { email: input.email ?? null } : {}),
    ...(input.phone !== undefined ? { phone: input.phone ?? null } : {}),
    ...(input.role !== undefined ? { role: input.role ?? null } : {}),
    ...(input.isPrimary !== undefined ? { isPrimary: input.isPrimary } : {}),
  };
}

export class PrismaSupplierRepository implements SupplierRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(storeId: string, id: string): Promise<Supplier | null> {
    const record = await this.db.supplier.findFirst({
      where: { id, storeId, deletedAt: null },
      include: contactInclude,
    });

    return record ? toSupplier(record) : null;
  }

  async list(query: ListSuppliersQuery) {
    const where = buildListWhere(query);
    const skip = (query.page - 1) * query.limit;

    const [records, total] = await Promise.all([
      this.db.supplier.findMany({
        where,
        include: contactInclude,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip,
        take: query.limit,
      }),
      this.db.supplier.count({ where }),
    ]);

    return buildCatalogueListResult({
      items: records.map(toSupplier),
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async create(input: CreateSupplierInput): Promise<Supplier> {
    const record = await this.db.supplier.create({
      data: buildCreateData(input),
      include: contactInclude,
    });

    return toSupplier(record);
  }

  async update(
    storeId: string,
    id: string,
    input: UpdateSupplierInput,
  ): Promise<Supplier> {
    const result = await this.db.supplier.updateMany({
      where: { id, storeId, deletedAt: null },
      data: buildUpdateData(input),
    });

    if (result.count === 0) {
      throw new Error(`Supplier not found: ${id}`);
    }

    const record = await this.db.supplier.findFirstOrThrow({
      where: { id, storeId },
      include: contactInclude,
    });

    return toSupplier(record);
  }

  async softDelete(storeId: string, id: string): Promise<Supplier> {
    const result = await this.db.supplier.updateMany({
      where: { id, storeId, deletedAt: null },
      data: { deletedAt: new Date(), status: "inactive" },
    });

    if (result.count === 0) {
      throw new Error(`Supplier not found: ${id}`);
    }

    const record = await this.db.supplier.findFirstOrThrow({
      where: { id, storeId },
      include: contactInclude,
    });

    return toSupplier(record);
  }

  async findContactById(
    storeId: string,
    contactId: string,
  ): Promise<SupplierContact | null> {
    const record = await this.db.supplierContact.findFirst({
      where: {
        id: contactId,
        supplier: { storeId, deletedAt: null },
      },
    });

    return record ? toSupplierContact(record) : null;
  }

  async createContact(
    storeId: string,
    supplierId: string,
    input: CreateSupplierContactInput,
  ): Promise<SupplierContact> {
    return this.db.$transaction(async (tx) => {
      const supplier = await tx.supplier.findFirst({
        where: { id: supplierId, storeId, deletedAt: null },
      });

      if (!supplier) {
        throw new Error(`Supplier not found: ${supplierId}`);
      }

      if (input.isPrimary) {
        await tx.supplierContact.updateMany({
          where: { supplierId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      const record = await tx.supplierContact.create({
        data: buildContactCreateData(supplierId, input),
      });

      return toSupplierContact(record);
    });
  }

  async updateContact(
    storeId: string,
    contactId: string,
    input: UpdateSupplierContactInput,
  ): Promise<SupplierContact> {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.supplierContact.findFirst({
        where: {
          id: contactId,
          supplier: { storeId, deletedAt: null },
        },
      });

      if (!existing) {
        throw new Error(`Supplier contact not found: ${contactId}`);
      }

      if (input.isPrimary === true) {
        await tx.supplierContact.updateMany({
          where: {
            supplierId: existing.supplierId,
            isPrimary: true,
            NOT: { id: contactId },
          },
          data: { isPrimary: false },
        });
      }

      const record = await tx.supplierContact.update({
        where: { id: contactId },
        data: buildContactUpdateData(input),
      });

      return toSupplierContact(record);
    });
  }

  async deleteContact(
    storeId: string,
    contactId: string,
  ): Promise<SupplierContact> {
    const existing = await this.findContactById(storeId, contactId);

    if (!existing) {
      throw new Error(`Supplier contact not found: ${contactId}`);
    }

    await this.db.supplierContact.delete({
      where: { id: contactId },
    });

    return existing;
  }
}
