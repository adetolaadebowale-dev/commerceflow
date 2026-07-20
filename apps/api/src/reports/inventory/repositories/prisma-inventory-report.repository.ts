import type {
  InventoryAllocationStatus,
  PrismaClient,
} from "@prisma/client";

import { InventoryAllocationStatusPolicy } from "@/inventory-allocation/policies/inventory-allocation-status.policy";
import { prisma } from "@/lib/prisma";
import { calculateAvailableQuantity } from "@/reservations/services/reservation-stock";
import {
  decimalToMoneyString,
} from "../../services/report-prisma-format";
import type {
  InventoryItemFact,
  InventoryMovementFact,
  InventoryReportRepository,
  ListInventoryItemFactsQuery,
  ListInventoryMovementFactsQuery,
} from "./inventory-report.repository";

const INCOMING_PURCHASE_ORDER_STATUSES = new Set([
  "approved",
  "ordered",
  "partially_received",
]);

/**
 * Database-backed inventory reporting: filtered item/movement reads with
 * reservation groupBy and indexed allocation/PO joins — no page-all loops.
 */
export class PrismaInventoryReportRepository implements InventoryReportRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async listItemFacts(
    query: ListInventoryItemFactsQuery,
  ): Promise<readonly InventoryItemFact[]> {
    const items = await this.db.inventoryItem.findMany({
      where: {
        storeId: query.storeId,
        deletedAt: null,
        ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
        ...(query.productVariantId
          ? { productVariantId: query.productVariantId }
          : {}),
      },
      select: {
        id: true,
        storeId: true,
        warehouseId: true,
        productVariantId: true,
        quantityOnHand: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "asc" },
    });

    if (items.length === 0) {
      return [];
    }

    const itemIds = items.map((item) => item.id);

    const [reservedGroups, allocations, purchaseOrders, rules] =
      await Promise.all([
        this.db.inventoryReservation.groupBy({
          by: ["inventoryItemId"],
          where: {
            storeId: query.storeId,
            status: "active",
            inventoryItemId: { in: itemIds },
          },
          _sum: { reservedQuantity: true },
        }),
        this.db.inventoryAllocation.findMany({
          where: {
            storeId: query.storeId,
            inventoryItemId: { in: itemIds },
          },
          select: {
            inventoryItemId: true,
            quantityAllocated: true,
            quantityPicked: true,
            status: true,
          },
        }),
        this.db.purchaseOrder.findMany({
          where: { storeId: query.storeId },
          select: {
            warehouseId: true,
            status: true,
            items: {
              select: {
                productVariantId: true,
                quantityOrdered: true,
                quantityReceived: true,
                unitCost: true,
                currency: true,
                updatedAt: true,
              },
            },
          },
        }),
        this.db.replenishmentRule.findMany({
          where: { storeId: query.storeId, isEnabled: true },
          select: {
            warehouseId: true,
            productVariantId: true,
            reorderPoint: true,
            reorderQuantity: true,
            supplierId: true,
          },
        }),
      ]);

    const reservedByItemId = new Map(
      reservedGroups.map((group) => [
        group.inventoryItemId,
        group._sum.reservedQuantity ?? 0,
      ]),
    );

    const allocationsByItemId = new Map<
      string,
      {
        readonly quantityAllocated: number;
        readonly quantityPicked: number;
        readonly status: InventoryAllocationStatus;
      }[]
    >();

    for (const allocation of allocations) {
      const list = allocationsByItemId.get(allocation.inventoryItemId) ?? [];
      list.push(allocation);
      allocationsByItemId.set(allocation.inventoryItemId, list);
    }

    const incomingByKey = new Map<string, number>();
    const unitCostByKey = new Map<
      string,
      { readonly unitCost: string; readonly currency: string; readonly updatedAt: string }
    >();

    for (const purchaseOrder of purchaseOrders) {
      for (const line of purchaseOrder.items) {
        const key = `${purchaseOrder.warehouseId}:${line.productVariantId}`;

        if (INCOMING_PURCHASE_ORDER_STATUSES.has(purchaseOrder.status)) {
          const incoming = Math.max(
            0,
            line.quantityOrdered - line.quantityReceived,
          );
          incomingByKey.set(key, (incomingByKey.get(key) ?? 0) + incoming);
        }

        if (purchaseOrder.status === "cancelled") {
          continue;
        }

        const updatedAt = line.updatedAt.toISOString();
        const existing = unitCostByKey.get(key);
        if (!existing || updatedAt.localeCompare(existing.updatedAt) > 0) {
          unitCostByKey.set(key, {
            unitCost: decimalToMoneyString(line.unitCost),
            currency: line.currency,
            updatedAt,
          });
        }
      }
    }

    const ruleByKey = new Map(
      rules.map((rule) => [
        `${rule.warehouseId}:${rule.productVariantId}`,
        rule,
      ]),
    );

    return items.map((item) => {
      const itemAllocations = allocationsByItemId.get(item.id) ?? [];
      const quantityReserved = reservedByItemId.get(item.id) ?? 0;
      const quantityAllocated = itemAllocations.reduce(
        (total, allocation) =>
          total +
          InventoryAllocationStatusPolicy.remainingHold(
            allocation.quantityAllocated,
            allocation.quantityPicked,
            allocation.status,
          ),
        0,
      );
      const quantityOutgoing = itemAllocations
        .filter(
          (allocation) =>
            allocation.status === "picked" ||
            allocation.status === "partially_picked",
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
      const key = `${item.warehouseId}:${item.productVariantId}`;
      const cost = unitCostByKey.get(key);
      const rule = ruleByKey.get(key);
      const quantityAvailable = calculateAvailableQuantity(
        item.quantityOnHand,
        quantityReserved + quantityAllocated,
      );

      return {
        inventoryItemId: item.id,
        storeId: item.storeId,
        warehouseId: item.warehouseId,
        productVariantId: item.productVariantId,
        quantityOnHand: item.quantityOnHand,
        quantityReserved,
        quantityAllocated,
        quantityAvailable,
        quantityIncoming: incomingByKey.get(key) ?? 0,
        quantityOutgoing,
        unitCost: cost?.unitCost ?? "0.00",
        currency: cost?.currency ?? "USD",
        reorderPoint: rule?.reorderPoint,
        reorderQuantity: rule?.reorderQuantity,
        supplierId: rule?.supplierId,
        reportTimestamp: item.updatedAt.toISOString(),
      };
    });
  }

  async listMovementFacts(
    query: ListInventoryMovementFactsQuery,
  ): Promise<readonly InventoryMovementFact[]> {
    const movements = await this.db.stockMovement.findMany({
      where: {
        storeId: query.storeId,
        ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
        ...(query.inventoryItemId
          ? { inventoryItemId: query.inventoryItemId }
          : {}),
        ...(query.movementType ? { movementType: query.movementType } : {}),
      },
      select: {
        id: true,
        storeId: true,
        inventoryItemId: true,
        warehouseId: true,
        movementType: true,
        quantity: true,
        previousQuantityOnHand: true,
        newQuantityOnHand: true,
        reference: true,
        createdAt: true,
        inventoryItem: { select: { productVariantId: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return movements.map((movement) => ({
      movementId: movement.id,
      storeId: movement.storeId,
      inventoryItemId: movement.inventoryItemId,
      warehouseId: movement.warehouseId,
      productVariantId: movement.inventoryItem.productVariantId,
      movementType: movement.movementType,
      quantity: movement.quantity,
      previousQuantityOnHand: movement.previousQuantityOnHand,
      newQuantityOnHand: movement.newQuantityOnHand,
      reference: movement.reference ?? undefined,
      reportTimestamp: movement.createdAt.toISOString(),
    }));
  }
}
