/** Invoice lifecycle statuses. */
export const INVOICE_STATUSES = [
  "draft",
  "issued",
  "paid",
  "void",
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
