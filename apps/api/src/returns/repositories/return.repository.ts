import type {
  Return,
  ReturnCompletionResult,
  ReturnItem,
} from "@commerceflow/types";
import type {
  CompleteReturnInput,
  InspectReturnInput,
  ReceiveReturnInput,
} from "@commerceflow/validation";

export interface CreateReturnRecord {
  readonly storeId: string;
  readonly orderId: string;
  readonly shipmentId: string;
  readonly returnNumber: string;
  readonly reason: string;
  readonly notes?: string;
  readonly requestedAt: Date;
  readonly items: readonly {
    readonly orderItemId: string;
    readonly inventoryItemId: string;
    readonly quantityRequested: number;
  }[];
}

export interface ReturnRepository {
  findById(storeId: string, id: string): Promise<Return | null>;
  listByOrderId(storeId: string, orderId: string): Promise<readonly Return[]>;
  sumRequestedQuantityByOrderItemId(
    storeId: string,
    orderItemId: string,
    excludeReturnId?: string,
  ): Promise<number>;
  create(record: CreateReturnRecord): Promise<Return>;
  receiveReturn(
    storeId: string,
    returnId: string,
    input: ReceiveReturnInput,
    receivedAt: Date,
  ): Promise<Return>;
  inspectReturn(
    storeId: string,
    returnId: string,
    input: InspectReturnInput,
  ): Promise<Return>;
  completeReturn(
    storeId: string,
    returnId: string,
    input: CompleteReturnInput,
    completedAt: Date,
  ): Promise<ReturnCompletionResult>;
}

export type { ReturnItem };
