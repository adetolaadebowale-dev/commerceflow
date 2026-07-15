import type {
  WarehouseTransfer,
  WarehouseTransferReceiveResult,
  WarehouseTransferShipResult,
} from "@commerceflow/types";
import { buildCatalogueListResult } from "@commerceflow/types";
import type { ListWarehouseTransfersQuery } from "@commerceflow/validation";

import type { MemoryInventoryItemRepository } from "../../inventory/repositories/memory-inventory-item.repository";
import type {
  CreateWarehouseTransferRecord,
  WarehouseTransferRepository,
} from "./warehouse-transfer.repository";

type MutableWarehouseTransferItem = {
  id: string;
  warehouseTransferId: string;
  inventoryItemId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
};

type MutableWarehouseTransferRecord = {
  id: string;
  storeId: string;
  transferNumber: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  status: WarehouseTransfer["status"];
  notes?: string;
  approvedAt?: string;
  shippedAt?: string;
  receivedAt?: string;
  createdAt: string;
  updatedAt: string;
  items: MutableWarehouseTransferItem[];
};

function toWarehouseTransfer(record: MutableWarehouseTransferRecord): WarehouseTransfer {
  return {
    ...record,
    items: record.items.map((item) => ({ ...item })),
  };
}

export class MemoryWarehouseTransferRepository
  implements WarehouseTransferRepository
{
  private readonly transfersById = new Map<string, MutableWarehouseTransferRecord>();
  private transactionFailure: Error | null = null;

  constructor(
    private readonly inventoryItemRepository: MemoryInventoryItemRepository,
  ) {}

  setTransactionFailure(error: Error | null): void {
    this.transactionFailure = error;
    this.inventoryItemRepository.setTransactionFailure(error);
  }

  async findById(storeId: string, id: string): Promise<WarehouseTransfer | null> {
    const record = this.transfersById.get(id);
    return record?.storeId === storeId ? toWarehouseTransfer(record) : null;
  }

  async list(query: ListWarehouseTransfersQuery) {
    const items = [...this.transfersById.values()]
      .filter((record) => record.storeId === query.storeId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    const start = (query.page - 1) * query.limit;

    return buildCatalogueListResult({
      items: items.slice(start, start + query.limit).map(toWarehouseTransfer),
      total: items.length,
      page: query.page,
      limit: query.limit,
    });
  }

  async create(record: CreateWarehouseTransferRecord): Promise<WarehouseTransfer> {
    const now = new Date().toISOString();
    const transferId = crypto.randomUUID();

    const transfer: MutableWarehouseTransferRecord = {
      id: transferId,
      storeId: record.storeId,
      transferNumber: record.transferNumber,
      sourceWarehouseId: record.sourceWarehouseId,
      destinationWarehouseId: record.destinationWarehouseId,
      status: "draft",
      notes: record.notes,
      items: record.items.map((item) => ({
        id: crypto.randomUUID(),
        warehouseTransferId: transferId,
        inventoryItemId: item.inventoryItemId,
        quantity: item.quantity,
        createdAt: now,
        updatedAt: now,
      })),
      createdAt: now,
      updatedAt: now,
    };

    this.transfersById.set(transferId, transfer);

    return toWarehouseTransfer(transfer);
  }

  async approveWarehouseTransfer(
    storeId: string,
    id: string,
    approvedAt: Date,
  ): Promise<WarehouseTransfer> {
    const existing = this.transfersById.get(id);

    if (!existing || existing.storeId !== storeId) {
      throw new Error(`WarehouseTransfer not found: ${id}`);
    }

    if (existing.status !== "draft") {
      throw new Error("INVALID_STATUS_TRANSITION");
    }

    for (const item of existing.items) {
      const inventory = await this.inventoryItemRepository.findById(
        storeId,
        item.inventoryItemId,
      );

      if (!inventory) {
        throw new Error(`InventoryItem not found: ${item.inventoryItemId}`);
      }

      if (inventory.quantityOnHand < item.quantity) {
        throw new Error("INSUFFICIENT_STOCK");
      }
    }

    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    existing.status = "approved";
    existing.approvedAt = approvedAt.toISOString();
    existing.updatedAt = approvedAt.toISOString();

    return toWarehouseTransfer(existing);
  }

  async shipWarehouseTransfer(
    storeId: string,
    id: string,
    shippedAt: Date,
  ): Promise<WarehouseTransferShipResult> {
    const existing = this.transfersById.get(id);

    if (!existing || existing.storeId !== storeId) {
      throw new Error(`WarehouseTransfer not found: ${id}`);
    }

    if (existing.status !== "approved") {
      throw new Error("INVALID_STATUS_TRANSITION");
    }

    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const stockMovements: WarehouseTransferShipResult["stockMovements"][number][] =
      [];
    const snapshots: { inventoryItemId: string; quantityOnHand: number }[] = [];

    try {
      for (const item of existing.items) {
        const inventory = await this.inventoryItemRepository.findById(
          storeId,
          item.inventoryItemId,
        );

        if (!inventory) {
          throw new Error(`InventoryItem not found: ${item.inventoryItemId}`);
        }

        const previousQuantityOnHand = inventory.quantityOnHand;
        const newQuantityOnHand = previousQuantityOnHand - item.quantity;

        if (newQuantityOnHand < 0) {
          throw new Error("INSUFFICIENT_STOCK");
        }

        snapshots.push({
          inventoryItemId: inventory.id,
          quantityOnHand: previousQuantityOnHand,
        });

        const mutableInventory = inventory as {
          quantityOnHand: number;
          updatedAt: string;
        };
        mutableInventory.quantityOnHand = newQuantityOnHand;
        mutableInventory.updatedAt = shippedAt.toISOString();

        stockMovements.push({
          id: crypto.randomUUID(),
          storeId,
          warehouseId: existing.sourceWarehouseId,
          inventoryItemId: inventory.id,
          movementType: "transfer",
          quantity: -item.quantity,
          previousQuantityOnHand,
          newQuantityOnHand,
          reference: existing.transferNumber,
          metadata: {
            warehouseTransferId: existing.id,
            warehouseTransferItemId: item.id,
            transferNumber: existing.transferNumber,
            sourceWarehouseId: existing.sourceWarehouseId,
            destinationWarehouseId: existing.destinationWarehouseId,
            direction: "outbound",
          },
          createdAt: shippedAt.toISOString(),
        });
      }

      existing.status = "in_transit";
      existing.shippedAt = shippedAt.toISOString();
      existing.updatedAt = shippedAt.toISOString();

      return {
        warehouseTransfer: toWarehouseTransfer(existing),
        stockMovements,
      };
    } catch (error) {
      for (const snapshot of snapshots) {
        const inventory = await this.inventoryItemRepository.findById(
          storeId,
          snapshot.inventoryItemId,
        );

        if (inventory) {
          (inventory as { quantityOnHand: number }).quantityOnHand =
            snapshot.quantityOnHand;
        }
      }

      throw error;
    }
  }

  async receiveWarehouseTransfer(
    storeId: string,
    id: string,
    receivedAt: Date,
  ): Promise<WarehouseTransferReceiveResult> {
    const existing = this.transfersById.get(id);

    if (!existing || existing.storeId !== storeId) {
      throw new Error(`WarehouseTransfer not found: ${id}`);
    }

    if (existing.status !== "in_transit") {
      throw new Error("INVALID_STATUS_TRANSITION");
    }

    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const stockMovements: WarehouseTransferReceiveResult["stockMovements"][number][] =
      [];
    const snapshots: { inventoryItemId: string; quantityOnHand: number }[] = [];

    try {
      for (const item of existing.items) {
        const sourceInventory = await this.inventoryItemRepository.findById(
          storeId,
          item.inventoryItemId,
        );

        if (!sourceInventory) {
          throw new Error(`InventoryItem not found: ${item.inventoryItemId}`);
        }

        let destinationInventory =
          await this.inventoryItemRepository.findByProductVariantId(
            storeId,
            existing.destinationWarehouseId,
            sourceInventory.productVariantId,
          );

        if (!destinationInventory) {
          const created = await this.inventoryItemRepository.createWithInitialMovement(
            {
              storeId,
              warehouseId: existing.destinationWarehouseId,
              productVariantId: sourceInventory.productVariantId,
              initialQuantity: 0,
            },
          );
          destinationInventory = created.inventoryItem;
        }

        const previousQuantityOnHand = destinationInventory.quantityOnHand;
        const newQuantityOnHand = previousQuantityOnHand + item.quantity;

        snapshots.push({
          inventoryItemId: destinationInventory.id,
          quantityOnHand: previousQuantityOnHand,
        });

        const mutableInventory = destinationInventory as {
          quantityOnHand: number;
          updatedAt: string;
        };
        mutableInventory.quantityOnHand = newQuantityOnHand;
        mutableInventory.updatedAt = receivedAt.toISOString();

        stockMovements.push({
          id: crypto.randomUUID(),
          storeId,
          warehouseId: existing.destinationWarehouseId,
          inventoryItemId: destinationInventory.id,
          movementType: "transfer",
          quantity: item.quantity,
          previousQuantityOnHand,
          newQuantityOnHand,
          reference: existing.transferNumber,
          metadata: {
            warehouseTransferId: existing.id,
            warehouseTransferItemId: item.id,
            transferNumber: existing.transferNumber,
            sourceWarehouseId: existing.sourceWarehouseId,
            destinationWarehouseId: existing.destinationWarehouseId,
            direction: "inbound",
          },
          createdAt: receivedAt.toISOString(),
        });
      }

      existing.status = "received";
      existing.receivedAt = receivedAt.toISOString();
      existing.updatedAt = receivedAt.toISOString();

      return {
        warehouseTransfer: toWarehouseTransfer(existing),
        stockMovements,
      };
    } catch (error) {
      for (const snapshot of snapshots) {
        const inventory = await this.inventoryItemRepository.findById(
          storeId,
          snapshot.inventoryItemId,
        );

        if (inventory) {
          (inventory as { quantityOnHand: number }).quantityOnHand =
            snapshot.quantityOnHand;
        }
      }

      throw error;
    }
  }

  async cancelWarehouseTransfer(
    storeId: string,
    id: string,
  ): Promise<WarehouseTransfer> {
    const existing = this.transfersById.get(id);

    if (!existing || existing.storeId !== storeId) {
      throw new Error(`WarehouseTransfer not found: ${id}`);
    }

    if (existing.status !== "draft" && existing.status !== "approved") {
      throw new Error("INVALID_STATUS_TRANSITION");
    }

    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    existing.status = "cancelled";
    existing.updatedAt = new Date().toISOString();

    return toWarehouseTransfer(existing);
  }
}
