import type {
  InventoryAllocation,
  InventoryReservation,
  PurchaseOrder,
} from "@commerceflow/types";

import { sumActiveAllocationHold } from "@/inventory-allocation/services/allocation-availability";
import { InventoryAllocationStatusPolicy } from "@/inventory-allocation/policies/inventory-allocation-status.policy";
import { getInventoryAllocationRepository } from "@/inventory-allocation/repositories";
import { getInventoryItemRepository, getStockMovementRepository } from "@/inventory/repositories";
import { getPurchaseOrderRepository } from "@/purchase-orders/repositories";
import { getInventoryReservationRepository } from "@/reservations/repositories";
import { getReplenishmentRepository } from "@/replenishment/repositories";
import { mapMovementToFact, mapItemToFact } from "../mappers/inventory-fact.mapper";
import { PrismaInventoryReportRepository } from "./prisma-inventory-report.repository";
import type {
  InventoryReportRepository,
  ListInventoryItemFactsQuery,
  ListInventoryMovementFactsQuery,
} from "./inventory-report.repository";

const REPORTING_PAGE_SIZE = 100;

const INCOMING_PURCHASE_ORDER_STATUSES = new Set([
  "approved",
  "ordered",
  "partially_received",
]);

export class DefaultInventoryReportRepository implements InventoryReportRepository {
  constructor(
    private readonly inventoryItemRepository = getInventoryItemRepository(),
    private readonly stockMovementRepository = getStockMovementRepository(),
    private readonly reservationRepository = getInventoryReservationRepository(),
    private readonly allocationRepository = getInventoryAllocationRepository(),
    private readonly purchaseOrderRepository = getPurchaseOrderRepository(),
    private readonly replenishmentRepository = getReplenishmentRepository(),
  ) {}

  async listItemFacts(query: ListInventoryItemFactsQuery) {
    const [
      items,
      reservations,
      allocations,
      purchaseOrders,
      rules,
    ] = await Promise.all([
      this.loadAllInventoryItems(query),
      this.reservationRepository.listByStoreId(query.storeId),
      this.allocationRepository.listByStoreId(query.storeId),
      this.loadAllPurchaseOrders(query.storeId),
      this.loadReplenishmentRules(query.storeId),
    ]);

    const unitCostByKey = buildUnitCostIndex(purchaseOrders);
    const incomingByKey = buildIncomingIndex(purchaseOrders);
    const ruleByKey = buildRuleIndex(rules);

    return items.map((item) =>
      mapItemToFact({
        item,
        quantityReserved: sumReservedQuantity(reservations, item.id),
        quantityAllocated: sumAllocatedQuantity(allocations, item.id),
        quantityIncoming:
          incomingByKey.get(`${item.warehouseId}:${item.productVariantId}`) ?? 0,
        quantityOutgoing: computeItemOutgoing(allocations, item.id),
        unitCost:
          unitCostByKey.get(`${item.warehouseId}:${item.productVariantId}`)
            ?.unitCost ?? "0.00",
        currency:
          unitCostByKey.get(`${item.warehouseId}:${item.productVariantId}`)
            ?.currency ?? "USD",
        rule: ruleByKey.get(`${item.warehouseId}:${item.productVariantId}`),
      }),
    );
  }

  async listMovementFacts(query: ListInventoryMovementFactsQuery) {
    const [movements, items] = await Promise.all([
      this.loadAllStockMovements(query),
      this.loadAllInventoryItems({ storeId: query.storeId }),
    ]);

    const variantByItemId = new Map(
      items.map((item) => [item.id, item.productVariantId]),
    );

    return movements.map((movement) =>
      mapMovementToFact(
        movement,
        variantByItemId.get(movement.inventoryItemId) ?? "unknown",
      ),
    );
  }

  private async loadAllInventoryItems(query: ListInventoryItemFactsQuery) {
    const items = [];
    let page = 1;
    let total = Number.POSITIVE_INFINITY;

    while (items.length < total) {
      const result = await this.inventoryItemRepository.list({
        storeId: query.storeId,
        warehouseId: query.warehouseId,
        productVariantId: query.productVariantId,
        page,
        limit: REPORTING_PAGE_SIZE,
      });

      items.push(...result.items);
      total = result.total;

      if (result.items.length === 0) {
        break;
      }

      page += 1;
    }

    return items;
  }

  private async loadAllPurchaseOrders(storeId: string) {
    const orders: PurchaseOrder[] = [];
    let page = 1;
    let total = Number.POSITIVE_INFINITY;

    while (orders.length < total) {
      const result = await this.purchaseOrderRepository.list({
        storeId,
        page,
        limit: REPORTING_PAGE_SIZE,
      });

      orders.push(...result.items);
      total = result.total;

      if (result.items.length === 0) {
        break;
      }

      page += 1;
    }

    return orders;
  }

  private async loadReplenishmentRules(storeId: string) {
    const rules = [];
    let page = 1;
    let total = Number.POSITIVE_INFINITY;

    while (rules.length < total) {
      const result = await this.replenishmentRepository.listRules({
        storeId,
        page,
        limit: REPORTING_PAGE_SIZE,
      });

      rules.push(...result.items);
      total = result.total;

      if (result.items.length === 0) {
        break;
      }

      page += 1;
    }

    return rules;
  }

  private async loadAllStockMovements(query: ListInventoryMovementFactsQuery) {
    const movements = [];
    let page = 1;
    let total = Number.POSITIVE_INFINITY;

    while (movements.length < total) {
      const result = await this.stockMovementRepository.list({
        storeId: query.storeId,
        warehouseId: query.warehouseId,
        inventoryItemId: query.inventoryItemId,
        page,
        limit: REPORTING_PAGE_SIZE,
      });

      const filtered = query.movementType
        ? result.items.filter(
            (movement) => movement.movementType === query.movementType,
          )
        : result.items;

      movements.push(...filtered);
      total = result.total;

      if (result.items.length === 0) {
        break;
      }

      page += 1;
    }

    return movements;
  }
}

function sumReservedQuantity(
  reservations: readonly InventoryReservation[],
  inventoryItemId: string,
): number {
  return reservations
    .filter(
      (reservation) =>
        reservation.inventoryItemId === inventoryItemId &&
        reservation.status === "active",
    )
    .reduce((total, reservation) => total + reservation.reservedQuantity, 0);
}

function sumAllocatedQuantity(
  allocations: readonly InventoryAllocation[],
  inventoryItemId: string,
): number {
  return sumActiveAllocationHold(
    allocations.filter(
      (allocation) => allocation.inventoryItemId === inventoryItemId,
    ),
  );
}

function buildIncomingIndex(purchaseOrders: readonly PurchaseOrder[]) {
  const incomingByKey = new Map<string, number>();

  for (const purchaseOrder of purchaseOrders) {
    if (!INCOMING_PURCHASE_ORDER_STATUSES.has(purchaseOrder.status)) {
      continue;
    }

    for (const item of purchaseOrder.items) {
      const key = `${purchaseOrder.warehouseId}:${item.productVariantId}`;
      const incoming = Math.max(0, item.quantityOrdered - item.quantityReceived);
      incomingByKey.set(key, (incomingByKey.get(key) ?? 0) + incoming);
    }
  }

  return incomingByKey;
}

function buildUnitCostIndex(purchaseOrders: readonly PurchaseOrder[]) {
  const unitCostByKey = new Map<
    string,
    { readonly unitCost: string; readonly currency: string; readonly updatedAt: string }
  >();

  for (const purchaseOrder of purchaseOrders) {
    if (purchaseOrder.status === "cancelled") {
      continue;
    }

    for (const item of purchaseOrder.items) {
      const key = `${purchaseOrder.warehouseId}:${item.productVariantId}`;
      const existing = unitCostByKey.get(key);

      if (!existing || item.updatedAt.localeCompare(existing.updatedAt) > 0) {
        unitCostByKey.set(key, {
          unitCost: item.unitCost,
          currency: item.currency,
          updatedAt: item.updatedAt,
        });
      }
    }
  }

  return unitCostByKey;
}

function buildRuleIndex(
  rules: readonly {
    readonly warehouseId: string;
    readonly productVariantId: string;
    readonly reorderPoint: number;
    readonly reorderQuantity: number;
    readonly supplierId: string;
    readonly isEnabled: boolean;
  }[],
) {
  const ruleByKey = new Map<
    string,
    {
      readonly reorderPoint: number;
      readonly reorderQuantity: number;
      readonly supplierId: string;
    }
  >();

  for (const rule of rules) {
    if (!rule.isEnabled) {
      continue;
    }

    ruleByKey.set(`${rule.warehouseId}:${rule.productVariantId}`, {
      reorderPoint: rule.reorderPoint,
      reorderQuantity: rule.reorderQuantity,
      supplierId: rule.supplierId,
    });
  }

  return ruleByKey;
}

function computeItemOutgoing(
  allocations: readonly InventoryAllocation[],
  inventoryItemId: string,
): number {
  return allocations
    .filter(
      (allocation) =>
        allocation.inventoryItemId === inventoryItemId &&
        (allocation.status === "picked" ||
          allocation.status === "partially_picked"),
    )
    .reduce(
      (total, allocation) =>
        total +
        InventoryAllocationStatusPolicy.remainingHold(
          allocation.quantityAllocated,
          allocation.quantityPicked,
          allocation.status,
        ),
      0,
    );
}

const inventoryReportRepository = new PrismaInventoryReportRepository();

export function getInventoryReportRepository(): InventoryReportRepository {
  return inventoryReportRepository;
}
