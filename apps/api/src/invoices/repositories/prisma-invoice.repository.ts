import {
  type Invoice as PrismaInvoice,
  type PrismaClient,
} from "@prisma/client";
import type { Invoice } from "@commerceflow/types";

import type { CreateInvoiceRecord } from "./invoice-create-record";
import type { InvoiceStatusTransitionInput } from "./invoice-create-record";
import type { InvoiceRepository } from "./invoice.repository";
import {
  generateInvoiceNumber,
  isUniqueInvoiceNumberViolation,
} from "../services/invoice-number";

const MAX_INVOICE_NUMBER_ATTEMPTS = 5;

function toInvoice(record: PrismaInvoice): Invoice {
  return {
    id: record.id,
    storeId: record.storeId,
    orderId: record.orderId,
    invoiceNumber: record.invoiceNumber,
    status: record.status,
    subtotal: record.subtotal.toString(),
    discountAmount: record.discountAmount?.toString(),
    total: record.total.toString(),
    currency: record.currency,
    issuedAt: record.issuedAt?.toISOString(),
    dueAt: record.dueAt?.toISOString(),
    paidAt: record.paidAt?.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class PrismaInvoiceRepository implements InvoiceRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(storeId: string, id: string): Promise<Invoice | null> {
    const record = await this.db.invoice.findFirst({
      where: { id, storeId },
    });

    return record ? toInvoice(record) : null;
  }

  async findByOrderId(
    storeId: string,
    orderId: string,
  ): Promise<Invoice | null> {
    const record = await this.db.invoice.findFirst({
      where: { storeId, orderId },
    });

    return record ? toInvoice(record) : null;
  }

  async listByOrderId(
    storeId: string,
    orderId: string,
  ): Promise<readonly Invoice[]> {
    const records = await this.db.invoice.findMany({
      where: { storeId, orderId },
      orderBy: { createdAt: "asc" },
    });

    return records.map(toInvoice);
  }

  async create(record: CreateInvoiceRecord): Promise<Invoice> {
    for (let attempt = 0; attempt < MAX_INVOICE_NUMBER_ATTEMPTS; attempt += 1) {
      const invoiceNumber = generateInvoiceNumber();

      try {
        const created = await this.db.invoice.create({
          data: {
            storeId: record.storeId,
            orderId: record.orderId,
            invoiceNumber,
            subtotal: record.subtotal,
            discountAmount: record.discountAmount,
            total: record.total,
            currency: record.currency,
            dueAt: record.dueAt ? new Date(record.dueAt) : undefined,
            status: "draft",
          },
        });

        return toInvoice(created);
      } catch (error) {
        if (
          isUniqueInvoiceNumberViolation(error) &&
          attempt < MAX_INVOICE_NUMBER_ATTEMPTS - 1
        ) {
          continue;
        }

        throw error;
      }
    }

    throw new Error("Unable to generate a unique invoice number");
  }

  async transitionStatus(
    storeId: string,
    id: string,
    transition: InvoiceStatusTransitionInput,
  ): Promise<Invoice> {
    return this.db.$transaction(async (tx) => {
      const updateData = {
        status: transition.toStatus,
        ...(transition.issuedAt ? { issuedAt: new Date(transition.issuedAt) } : {}),
        ...(transition.paidAt ? { paidAt: new Date(transition.paidAt) } : {}),
      };

      const updated = await tx.invoice.updateMany({
        where: {
          id,
          storeId,
          status: transition.fromStatus,
        },
        data: updateData,
      });

      if (updated.count === 0) {
        const existing = await tx.invoice.findFirst({
          where: { id, storeId },
          select: { status: true },
        });

        if (!existing) {
          throw new Error(`Invoice not found: ${id}`);
        }

        throw new Error(
          `Invoice transition rejected: ${existing.status} -> ${transition.toStatus}`,
        );
      }

      const record = await tx.invoice.findFirstOrThrow({
        where: { id, storeId },
      });

      return toInvoice(record);
    });
  }
}
