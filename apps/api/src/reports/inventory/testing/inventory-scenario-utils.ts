import type { InventoryItem, PurchaseOrder } from "@commerceflow/types";

import type { MemoryInventoryItemRepository } from "@/inventory/repositories/memory-inventory-item.repository";
import type { MemoryPurchaseOrderRepository } from "@/purchase-orders/repositories/memory-purchase-order.repository";
import type { MemoryInventoryReservationRepository } from "@/reservations/repositories/memory-inventory-reservation.repository";
import type { MemoryReplenishmentRepository } from "@/replenishment/repositories/memory-replenishment.repository";
import { TEST_VARIANT_A_ID } from "@/reservations/testing/reservation-test-utils";

export const TEST_SUPPLIER_A_ID = "dddddddd-dddd-dddd-dddd-dddddddddddd";

export interface SeedInventoryItemInput {
  readonly storeId: string;
  readonly warehouseId: string;
  readonly productVariantId?: string;
  readonly quantityOnHand: number;
  readonly reservedQuantity?: number;
  readonly reorderPoint?: number;
  readonly reorderQuantity?: number;
  readonly supplierId?: string;
  readonly incomingQuantity?: number;
  readonly unitCost?: string;
}

export async function seedInventoryReportingScenario(
  module: {
    inventoryItemRepository: MemoryInventoryItemRepository;
    reservationRepository: MemoryInventoryReservationRepository;
    replenishmentRepository: MemoryReplenishmentRepository;
    purchaseOrderRepository: MemoryPurchaseOrderRepository;
  },
  items: readonly SeedInventoryItemInput[],
) {
  const seededItems: InventoryItem[] = [];

  for (const input of items) {
    const now = new Date().toISOString();
    const productVariantId = input.productVariantId ?? TEST_VARIANT_A_ID;
    const itemId = crypto.randomUUID();
    const item: InventoryItem = {
      id: itemId,
      storeId: input.storeId,
      warehouseId: input.warehouseId,
      productVariantId,
      quantityOnHand: input.quantityOnHand,
      createdAt: now,
      updatedAt: now,
    };

    module.inventoryItemRepository.seedInventoryItem(item);
    seededItems.push(item);

    if (input.reservedQuantity && input.reservedQuantity > 0) {
      module.reservationRepository.seedReservation({
        id: crypto.randomUUID(),
        storeId: input.storeId,
        orderId: crypto.randomUUID(),
        orderItemId: crypto.randomUUID(),
        inventoryItemId: itemId,
        reservedQuantity: input.reservedQuantity,
        status: "active",
        createdAt: now,
      });
    }

    if (input.reorderPoint !== undefined) {
      await module.replenishmentRepository.createRule({
        storeId: input.storeId,
        warehouseId: input.warehouseId,
        productVariantId,
        supplierId: input.supplierId ?? TEST_SUPPLIER_A_ID,
        reorderPoint: input.reorderPoint,
        reorderQuantity: input.reorderQuantity ?? 20,
        isEnabled: true,
      });
    }

    if (input.incomingQuantity && input.incomingQuantity > 0) {
      module.purchaseOrderRepository.seedPurchaseOrder(
        buildIncomingPurchaseOrder({
          storeId: input.storeId,
          warehouseId: input.warehouseId,
          productVariantId,
          supplierId: input.supplierId ?? TEST_SUPPLIER_A_ID,
          incomingQuantity: input.incomingQuantity,
          unitCost: input.unitCost ?? "10.00",
        }),
      );
    }

    if (input.unitCost) {
      module.purchaseOrderRepository.seedPurchaseOrder(
        buildReceivedPurchaseOrder({
          storeId: input.storeId,
          warehouseId: input.warehouseId,
          productVariantId,
          supplierId: input.supplierId ?? TEST_SUPPLIER_A_ID,
          quantity: input.quantityOnHand,
          unitCost: input.unitCost,
        }),
      );
    }
  }

  return seededItems;
}

function buildIncomingPurchaseOrder(input: {
  storeId: string;
  warehouseId: string;
  productVariantId: string;
  supplierId: string;
  incomingQuantity: number;
  unitCost: string;
}): PurchaseOrder {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  return {
    id,
    storeId: input.storeId,
    warehouseId: input.warehouseId,
    supplierId: input.supplierId,
    purchaseOrderNumber: `PO-${id.slice(0, 8)}`,
    status: "ordered",
    items: [
      {
        id: crypto.randomUUID(),
        purchaseOrderId: id,
        productVariantId: input.productVariantId,
        quantityOrdered: input.incomingQuantity,
        quantityReceived: 0,
        unitCost: input.unitCost,
        currency: "USD",
        createdAt: now,
        updatedAt: now,
      },
    ],
    orderedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

function buildReceivedPurchaseOrder(input: {
  storeId: string;
  warehouseId: string;
  productVariantId: string;
  supplierId: string;
  quantity: number;
  unitCost: string;
}): PurchaseOrder {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  return {
    id,
    storeId: input.storeId,
    warehouseId: input.warehouseId,
    supplierId: input.supplierId,
    purchaseOrderNumber: `PO-${id.slice(0, 8)}`,
    status: "received",
    items: [
      {
        id: crypto.randomUUID(),
        purchaseOrderId: id,
        productVariantId: input.productVariantId,
        quantityOrdered: input.quantity,
        quantityReceived: input.quantity,
        unitCost: input.unitCost,
        currency: "USD",
        createdAt: now,
        updatedAt: now,
      },
    ],
    receivedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}
