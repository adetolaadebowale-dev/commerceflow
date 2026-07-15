import {
  buildCatalogueListResult,
  type Supplier,
  type SupplierContact,
  type SupplierStatus,
} from "@commerceflow/types";
import type {
  CreateSupplierContactInput,
  CreateSupplierInput,
  ListSuppliersQuery,
  UpdateSupplierContactInput,
  UpdateSupplierInput,
} from "@commerceflow/validation";

import type { SupplierRepository } from "./supplier.repository";

function sortContacts(contacts: readonly SupplierContact[]): SupplierContact[] {
  return [...contacts].sort(
    (left, right) =>
      Number(right.isPrimary) - Number(left.isPrimary) ||
      left.createdAt.localeCompare(right.createdAt) ||
      left.id.localeCompare(right.id),
  );
}

function buildSupplier(
  record: Omit<Supplier, "contacts">,
  contacts: SupplierContact[],
): Supplier {
  return {
    ...record,
    contacts: sortContacts(contacts),
  };
}

export class MemorySupplierRepository implements SupplierRepository {
  private readonly suppliersById = new Map<
    string,
    Omit<Supplier, "contacts">
  >();
  private readonly contactsById = new Map<string, SupplierContact>();
  private readonly deletedIds = new Set<string>();
  private transactionFailure: Error | null = null;

  setTransactionFailure(error: Error | null): void {
    this.transactionFailure = error;
  }

  seedSupplier(
    supplier: {
      id: string;
      storeId: string;
      code: string;
      name: string;
      status?: SupplierStatus;
      email?: string;
      phone?: string;
      website?: string;
      taxId?: string;
      paymentTerm?: Supplier["paymentTerm"];
      currency?: string;
      notes?: string;
    },
  ): void {
    const now = new Date().toISOString();
    this.suppliersById.set(supplier.id, {
      id: supplier.id,
      storeId: supplier.storeId,
      code: supplier.code,
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      website: supplier.website,
      taxId: supplier.taxId,
      paymentTerm: supplier.paymentTerm ?? "net30",
      currency: supplier.currency ?? "USD",
      status: supplier.status ?? "active",
      notes: supplier.notes,
      createdAt: now,
      updatedAt: now,
    });
  }

  async findById(storeId: string, id: string): Promise<Supplier | null> {
    if (this.deletedIds.has(id)) {
      return null;
    }

    const record = this.suppliersById.get(id);
    if (!record || record.storeId !== storeId) {
      return null;
    }

    return buildSupplier(record, this.getContactsForSupplier(id));
  }

  async list(query: ListSuppliersQuery) {
    let items = [...this.suppliersById.values()]
      .filter(
        (supplier) =>
          supplier.storeId === query.storeId &&
          !this.deletedIds.has(supplier.id),
      )
      .map((supplier) =>
        buildSupplier(supplier, this.getContactsForSupplier(supplier.id)),
      );

    if (query.status) {
      items = items.filter((supplier) => supplier.status === query.status);
    }

    if (query.search) {
      const search = query.search.toLowerCase();
      items = items.filter(
        (supplier) =>
          supplier.name.toLowerCase().includes(search) ||
          supplier.code.toLowerCase().includes(search),
      );
    }

    items.sort(
      (left, right) =>
        right.createdAt.localeCompare(left.createdAt) ||
        left.id.localeCompare(right.id),
    );

    const total = items.length;
    const start = (query.page - 1) * query.limit;
    const paged = items.slice(start, start + query.limit);

    return buildCatalogueListResult({
      items: paged,
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async create(input: CreateSupplierInput): Promise<Supplier> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    await this.assertCodeAvailable(input.storeId, input.code);

    const now = new Date().toISOString();
    const record: Omit<Supplier, "contacts"> = {
      id: crypto.randomUUID(),
      storeId: input.storeId,
      code: input.code.trim(),
      name: input.name.trim(),
      email: input.email,
      phone: input.phone,
      website: input.website,
      taxId: input.taxId,
      paymentTerm: input.paymentTerm,
      currency: input.currency,
      status: input.status,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };

    this.suppliersById.set(record.id, record);
    return buildSupplier(record, []);
  }

  async update(
    storeId: string,
    id: string,
    input: UpdateSupplierInput,
  ): Promise<Supplier> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);
    if (!existing) {
      throw new Error(`Supplier not found: ${id}`);
    }

    if (input.code !== undefined && input.code !== existing.code) {
      await this.assertCodeAvailable(storeId, input.code, id);
    }

    const updated: Omit<Supplier, "contacts"> = {
      ...this.suppliersById.get(id)!,
      ...(input.code !== undefined ? { code: input.code.trim() } : {}),
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.website !== undefined ? { website: input.website } : {}),
      ...(input.taxId !== undefined ? { taxId: input.taxId } : {}),
      ...(input.paymentTerm !== undefined
        ? { paymentTerm: input.paymentTerm }
        : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      updatedAt: new Date().toISOString(),
    };

    this.suppliersById.set(id, updated);
    return buildSupplier(updated, this.getContactsForSupplier(id));
  }

  async softDelete(storeId: string, id: string): Promise<Supplier> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findById(storeId, id);
    if (!existing) {
      throw new Error(`Supplier not found: ${id}`);
    }

    this.deletedIds.add(id);
    const deleted: Omit<Supplier, "contacts"> = {
      ...this.suppliersById.get(id)!,
      status: "inactive",
      updatedAt: new Date().toISOString(),
    };
    this.suppliersById.set(id, deleted);
    return buildSupplier(deleted, this.getContactsForSupplier(id));
  }

  async findContactById(
    storeId: string,
    contactId: string,
  ): Promise<SupplierContact | null> {
    const contact = this.contactsById.get(contactId);
    if (!contact) {
      return null;
    }

    const supplier = this.suppliersById.get(contact.supplierId);
    if (
      !supplier ||
      supplier.storeId !== storeId ||
      this.deletedIds.has(supplier.id)
    ) {
      return null;
    }

    return contact;
  }

  async createContact(
    storeId: string,
    supplierId: string,
    input: CreateSupplierContactInput,
  ): Promise<SupplierContact> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const supplier = await this.findById(storeId, supplierId);
    if (!supplier) {
      throw new Error(`Supplier not found: ${supplierId}`);
    }

    if (input.isPrimary) {
      await this.clearPrimaryContacts(supplierId);
    }

    const now = new Date().toISOString();
    const contact: SupplierContact = {
      id: crypto.randomUUID(),
      supplierId,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email,
      phone: input.phone,
      role: input.role,
      isPrimary: input.isPrimary,
      createdAt: now,
      updatedAt: now,
    };

    this.contactsById.set(contact.id, contact);
    return contact;
  }

  async updateContact(
    storeId: string,
    contactId: string,
    input: UpdateSupplierContactInput,
  ): Promise<SupplierContact> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findContactById(storeId, contactId);
    if (!existing) {
      throw new Error(`Supplier contact not found: ${contactId}`);
    }

    if (input.isPrimary === true) {
      await this.clearPrimaryContacts(existing.supplierId, contactId);
    }

    const updated: SupplierContact = {
      ...existing,
      ...(input.firstName !== undefined
        ? { firstName: input.firstName.trim() }
        : {}),
      ...(input.lastName !== undefined
        ? { lastName: input.lastName.trim() }
        : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.isPrimary !== undefined ? { isPrimary: input.isPrimary } : {}),
      updatedAt: new Date().toISOString(),
    };

    this.contactsById.set(contactId, updated);
    return updated;
  }

  async deleteContact(
    storeId: string,
    contactId: string,
  ): Promise<SupplierContact> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findContactById(storeId, contactId);
    if (!existing) {
      throw new Error(`Supplier contact not found: ${contactId}`);
    }

    this.contactsById.delete(contactId);
    return existing;
  }

  private getContactsForSupplier(supplierId: string): SupplierContact[] {
    return sortContacts(
      [...this.contactsById.values()].filter(
        (contact) => contact.supplierId === supplierId,
      ),
    );
  }

  private async assertCodeAvailable(
    storeId: string,
    code: string,
    exceptId?: string,
  ): Promise<void> {
    for (const supplier of this.suppliersById.values()) {
      if (
        supplier.storeId === storeId &&
        supplier.code === code.trim() &&
        !this.deletedIds.has(supplier.id) &&
        supplier.id !== exceptId
      ) {
        throw new Error(`Supplier code already exists: ${code}`);
      }
    }
  }

  private async clearPrimaryContacts(
    supplierId: string,
    exceptId?: string,
  ): Promise<void> {
    for (const contact of this.contactsById.values()) {
      if (
        contact.supplierId === supplierId &&
        contact.isPrimary &&
        contact.id !== exceptId
      ) {
        this.contactsById.set(contact.id, {
          ...contact,
          isPrimary: false,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }
}
