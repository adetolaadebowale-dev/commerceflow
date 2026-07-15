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

import type { MemoryInventoryItemRepository } from "../../inventory/repositories/memory-inventory-item.repository";
import { RESTOCKABLE_RETURN_CONDITIONS } from "@commerceflow/types";
import type {
  CreateReturnRecord,
  ReturnRepository,
} from "./return.repository";

type MutableReturnRecord = Omit<Return, "items"> & {
  items: ReturnItem[];
};

function toReturn(record: MutableReturnRecord): Return {
  return {
    ...record,
    items: record.items.map((item) => ({ ...item })),
  };
}

export class MemoryReturnRepository implements ReturnRepository {
  private readonly returnsById = new Map<string, MutableReturnRecord>();
  private transactionFailure: Error | null = null;

  constructor(
    private readonly inventoryItemRepository: MemoryInventoryItemRepository,
  ) {}

  setTransactionFailure(error: Error | null): void {
    this.transactionFailure = error;
    this.inventoryItemRepository.setTransactionFailure(error);
  }

  async findById(storeId: string, id: string): Promise<Return | null> {
    const record = this.returnsById.get(id);
    return record?.storeId === storeId ? toReturn(record) : null;
  }

  async listByOrderId(
    storeId: string,
    orderId: string,
  ): Promise<readonly Return[]> {
    return [...this.returnsById.values()]
      .filter((record) => record.storeId === storeId && record.orderId === orderId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map(toReturn);
  }

  async sumRequestedQuantityByOrderItemId(
    storeId: string,
    orderItemId: string,
    excludeReturnId?: string,
  ): Promise<number> {
    let total = 0;

    for (const record of this.returnsById.values()) {
      if (record.storeId !== storeId || record.id === excludeReturnId) {
        continue;
      }

      if (record.status === "rejected") {
        continue;
      }

      for (const item of record.items) {
        if (item.orderItemId === orderItemId) {
          total += item.quantityRequested;
        }
      }
    }

    return total;
  }

  async create(record: CreateReturnRecord): Promise<Return> {
    const now = new Date().toISOString();
    const returnId = crypto.randomUUID();
    const returnRecord: MutableReturnRecord = {
      id: returnId,
      storeId: record.storeId,
      orderId: record.orderId,
      shipmentId: record.shipmentId,
      returnNumber: record.returnNumber,
      status: "requested",
      reason: record.reason,
      notes: record.notes,
      requestedAt: record.requestedAt.toISOString(),
      items: record.items.map((item) => ({
        id: crypto.randomUUID(),
        returnId,
        orderItemId: item.orderItemId,
        inventoryItemId: item.inventoryItemId,
        quantityRequested: item.quantityRequested,
        quantityReceived: 0,
        quantityRestocked: 0,
        createdAt: now,
        updatedAt: now,
      })),
      createdAt: now,
      updatedAt: now,
    };

    this.returnsById.set(returnRecord.id, returnRecord);
    return toReturn(returnRecord);
  }

  async receiveReturn(
    storeId: string,
    returnId: string,
    input: ReceiveReturnInput,
    receivedAt: Date,
  ): Promise<Return> {
    const record = await this.requireReturn(storeId, returnId);

    if (record.status !== "requested") {
      throw new Error("INVALID_STATUS_TRANSITION");
    }

    const updatedItems = record.items.map((item) => {
      const update = input.items.find((entry) => entry.returnItemId === item.id);

      if (!update) {
        return item;
      }

      if (update.quantityReceived > item.quantityRequested) {
        throw new Error("QUANTITY_EXCEEDED");
      }

      return {
        ...item,
        quantityReceived: update.quantityReceived,
        updatedAt: new Date().toISOString(),
      };
    });

    const updated: MutableReturnRecord = {
      ...record,
      status: "received",
      receivedAt: receivedAt.toISOString(),
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    };

    this.returnsById.set(returnId, updated);
    return toReturn(updated);
  }

  async inspectReturn(
    storeId: string,
    returnId: string,
    input: InspectReturnInput,
  ): Promise<Return> {
    const record = await this.requireReturn(storeId, returnId);

    if (record.status !== "received") {
      throw new Error("INVALID_STATUS_TRANSITION");
    }

    const updatedItems = record.items.map((item) => {
      const update = input.items.find((entry) => entry.returnItemId === item.id);

      if (!update) {
        return item;
      }

      return {
        ...item,
        condition: update.condition,
        updatedAt: new Date().toISOString(),
      };
    });

    const updated: MutableReturnRecord = {
      ...record,
      status: "inspecting",
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    };

    this.returnsById.set(returnId, updated);
    return toReturn(updated);
  }

  async completeReturn(
    storeId: string,
    returnId: string,
    _input: CompleteReturnInput,
    completedAt: Date,
  ): Promise<ReturnCompletionResult> {
    const record = await this.requireReturn(storeId, returnId);

    if (record.status !== "inspecting") {
      throw new Error("INVALID_STATUS_TRANSITION");
    }

    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const stockMovements: ReturnCompletionResult["stockMovements"][number][] = [];
    const inventoryItems: ReturnCompletionResult["inventoryItems"][number][] = [];
    let restockCount = 0;

    const updatedItems = await Promise.all(
      record.items.map(async (item) => {
        const quantityRestocked =
          item.condition &&
          RESTOCKABLE_RETURN_CONDITIONS.includes(
            item.condition as (typeof RESTOCKABLE_RETURN_CONDITIONS)[number],
          )
            ? item.quantityReceived
            : 0;

        if (quantityRestocked > 0) {
          restockCount += 1;
          const result = await this.inventoryItemRepository.restockForReturn(
            storeId,
            item.inventoryItemId,
            quantityRestocked,
            {
              returnId: record.id,
              returnItemId: item.id,
              reference: record.returnNumber,
            },
          );
          stockMovements.push(result.stockMovement);
          inventoryItems.push(result.inventoryItem);
        }

        return {
          ...item,
          quantityRestocked,
          updatedAt: new Date().toISOString(),
        };
      }),
    );

    const updated: MutableReturnRecord = {
      ...record,
      status: restockCount > 0 ? "completed" : "rejected",
      completedAt: completedAt.toISOString(),
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    };

    this.returnsById.set(returnId, updated);

    return {
      return: toReturn(updated),
      stockMovements,
      inventoryItems,
    };
  }

  private async requireReturn(
    storeId: string,
    returnId: string,
  ): Promise<MutableReturnRecord> {
    const record = this.returnsById.get(returnId);

    if (!record || record.storeId !== storeId) {
      throw new Error(`Return not found: ${returnId}`);
    }

    return record;
  }
}
