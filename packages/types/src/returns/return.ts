import type { ReturnItem } from "./return-item";
import type { ReturnStatus } from "./return-status";

/** Store-scoped warehouse return linked to a fulfilled shipment. */
export interface Return {
  readonly id: string;
  readonly storeId: string;
  readonly orderId: string;
  readonly shipmentId: string;
  readonly returnNumber: string;
  readonly status: ReturnStatus;
  readonly reason: string;
  readonly notes?: string;
  readonly requestedAt: string;
  readonly receivedAt?: string;
  readonly completedAt?: string;
  readonly items: readonly ReturnItem[];
  readonly createdAt: string;
  readonly updatedAt: string;
}
