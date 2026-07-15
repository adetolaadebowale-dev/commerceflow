import type { ReturnCondition } from "./return-condition";

/** Line item belonging to a warehouse return. */
export interface ReturnItem {
  readonly id: string;
  readonly returnId: string;
  readonly orderItemId: string;
  readonly inventoryItemId: string;
  readonly quantityRequested: number;
  readonly quantityReceived: number;
  readonly quantityRestocked: number;
  readonly condition?: ReturnCondition;
  readonly createdAt: string;
  readonly updatedAt: string;
}
