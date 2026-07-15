import { PrismaInvoiceRepository } from "./prisma-invoice.repository";
import type { InvoiceRepository } from "./invoice.repository";
import { prisma } from "@/lib/prisma";

const invoiceRepository: InvoiceRepository = new PrismaInvoiceRepository(prisma);

export function getInvoiceRepository(): InvoiceRepository {
  return invoiceRepository;
}

export type { InvoiceRepository } from "./invoice.repository";
export type {
  CreateInvoiceRecord,
  InvoiceStatusTransitionInput,
} from "./invoice-create-record";
