import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

export const createInvoiceSchema = z.object({
  dueAt: z.string().datetime({ message: "Due date must be a valid ISO datetime" }).optional(),
});

export const invoiceIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export const orderInvoiceActionSchema = invoiceIdQuerySchema;

export const listOrderInvoicesQuerySchema = invoiceIdQuerySchema;

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type InvoiceIdQuery = z.infer<typeof invoiceIdQuerySchema>;
export type OrderInvoiceActionQuery = z.infer<typeof orderInvoiceActionSchema>;
export type ListOrderInvoicesQuery = z.infer<typeof listOrderInvoicesQuerySchema>;
