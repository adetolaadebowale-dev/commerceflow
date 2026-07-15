import type { Invoice } from "@commerceflow/types";

import { generateInvoiceNumber } from "../services/invoice-number";
import type { CreateInvoiceRecord } from "./invoice-create-record";
import type { InvoiceStatusTransitionInput } from "./invoice-create-record";
import type { InvoiceRepository } from "./invoice.repository";

export class MemoryInvoiceRepository implements InvoiceRepository {
  private readonly invoicesById = new Map<string, Invoice>();
  private readonly invoiceNumbersByStore = new Map<string, Set<string>>();
  private transactionFailure: Error | null = null;
  private forceInvoiceNumberCollision = false;

  setTransactionFailure(error: Error | null): void {
    this.transactionFailure = error;
  }

  forceNextInvoiceNumberCollision(): void {
    this.forceInvoiceNumberCollision = true;
  }

  getInvoiceCount(): number {
    return this.invoicesById.size;
  }

  async findById(storeId: string, id: string): Promise<Invoice | null> {
    const invoice = this.invoicesById.get(id);
    return invoice?.storeId === storeId ? invoice : null;
  }

  async findByOrderId(
    storeId: string,
    orderId: string,
  ): Promise<Invoice | null> {
    const invoice = [...this.invoicesById.values()].find(
      (entry) => entry.storeId === storeId && entry.orderId === orderId,
    );

    return invoice ?? null;
  }

  async listByOrderId(
    storeId: string,
    orderId: string,
  ): Promise<readonly Invoice[]> {
    return [...this.invoicesById.values()]
      .filter(
        (invoice) => invoice.storeId === storeId && invoice.orderId === orderId,
      )
      .sort(
        (left, right) =>
          left.createdAt.localeCompare(right.createdAt) ||
          left.id.localeCompare(right.id),
      );
  }

  async create(record: CreateInvoiceRecord): Promise<Invoice> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      if (this.transactionFailure) {
        throw this.transactionFailure;
      }

      let invoiceNumber = generateInvoiceNumber();

      if (this.forceInvoiceNumberCollision && attempt === 0) {
        const existing = this.invoicesById.values().next().value as
          | Invoice
          | undefined;
        if (existing) {
          invoiceNumber = existing.invoiceNumber;
        }
        this.forceInvoiceNumberCollision = false;
      }

      const numbers =
        this.invoiceNumbersByStore.get(record.storeId) ?? new Set<string>();

      if (numbers.has(invoiceNumber)) {
        continue;
      }

      const now = new Date().toISOString();
      const invoice: Invoice = {
        id: crypto.randomUUID(),
        storeId: record.storeId,
        orderId: record.orderId,
        invoiceNumber,
        status: "draft",
        subtotal: record.subtotal,
        currency: record.currency,
        dueAt: record.dueAt,
        createdAt: now,
        updatedAt: now,
      };

      numbers.add(invoiceNumber);
      this.invoiceNumbersByStore.set(record.storeId, numbers);
      this.invoicesById.set(invoice.id, invoice);
      return invoice;
    }

    throw new Error("Unable to generate a unique invoice number");
  }

  async transitionStatus(
    storeId: string,
    id: string,
    transition: InvoiceStatusTransitionInput,
  ): Promise<Invoice> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = this.invoicesById.get(id);

    if (!existing || existing.storeId !== storeId) {
      throw new Error(`Invoice not found: ${id}`);
    }

    if (existing.status !== transition.fromStatus) {
      throw new Error(
        `Invoice transition rejected: ${existing.status} -> ${transition.toStatus}`,
      );
    }

    const updated: Invoice = {
      ...existing,
      status: transition.toStatus,
      issuedAt: transition.issuedAt ?? existing.issuedAt,
      paidAt: transition.paidAt ?? existing.paidAt,
      updatedAt: new Date().toISOString(),
    };

    this.invoicesById.set(id, updated);
    return updated;
  }
}
