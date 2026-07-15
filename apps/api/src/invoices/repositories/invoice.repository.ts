import type { Invoice } from "@commerceflow/types";

import type { CreateInvoiceRecord } from "./invoice-create-record";
import type { InvoiceStatusTransitionInput } from "./invoice-create-record";

export interface InvoiceRepository {
  findById(storeId: string, id: string): Promise<Invoice | null>;
  findByOrderId(storeId: string, orderId: string): Promise<Invoice | null>;
  listByOrderId(storeId: string, orderId: string): Promise<readonly Invoice[]>;
  create(record: CreateInvoiceRecord): Promise<Invoice>;
  transitionStatus(
    storeId: string,
    id: string,
    transition: InvoiceStatusTransitionInput,
  ): Promise<Invoice>;
}
