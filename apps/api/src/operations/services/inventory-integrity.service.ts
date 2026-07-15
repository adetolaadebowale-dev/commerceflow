import type { IntegrityCheckResult, IntegrityIssue } from "@commerceflow/types";

import type { OperationsContext } from "../providers/operations-context";
import {
  OPERATIONS_INTEGRITY_CODES,
  buildIntegrityResult,
} from "./operations-utils";

export class InventoryIntegrityService {
  validate(context: OperationsContext): IntegrityCheckResult {
    const issues: IntegrityIssue[] = [
      ...this.validateAllocationRelease(context),
      ...this.validateAdjustmentWarehouseConsistency(context),
      ...this.validateReplenishmentAfterReceiving(context),
      ...this.validateReturnReplenishmentInteraction(context),
      ...this.validateCycleCountReplenishment(context),
    ];

    return buildIntegrityResult(issues);
  }

  private validateAllocationRelease(
    context: OperationsContext,
  ): IntegrityIssue[] {
    const issues: IntegrityIssue[] = [];
    const fulfilledShipmentIds = new Set(
      context.shipments
        .filter((shipment) => shipment.fulfilledAt)
        .map((shipment) => shipment.id),
    );
    const pickListsByShipmentId = new Map(
      context.pickLists.map((pickList) => [pickList.shipmentId, pickList]),
    );

    for (const shipmentId of fulfilledShipmentIds) {
      const pickList = pickListsByShipmentId.get(shipmentId);

      if (!pickList) {
        continue;
      }

      const pickListItemIds = new Set(pickList.items.map((item) => item.id));
      const relatedAllocations = context.allocations.filter((allocation) =>
        pickListItemIds.has(allocation.pickListItemId),
      );

      const unreleased = relatedAllocations.filter(
        (allocation) => allocation.status !== "fulfilled",
      );

      for (const allocation of unreleased) {
        issues.push({
          code: OPERATIONS_INTEGRITY_CODES.ALLOCATION_NOT_RELEASED,
          message:
            "Allocation hold was not fully released after shipment fulfillment",
          entityType: "inventory_allocation",
          entityId: allocation.id,
        });
      }
    }

    return issues;
  }

  private validateAdjustmentWarehouseConsistency(
    context: OperationsContext,
  ): IntegrityIssue[] {
    const issues: IntegrityIssue[] = [];
    const inventoryItemById = new Map(
      context.inventoryItems.map((item) => [item.id, item]),
    );
    const warehouseIds = new Set(context.warehouses.map((warehouse) => warehouse.id));

    for (const adjustment of context.inventoryAdjustments) {
      if (!warehouseIds.has(adjustment.warehouseId)) {
        issues.push({
          code: OPERATIONS_INTEGRITY_CODES.ADJUSTMENT_WAREHOUSE_MISMATCH,
          message: "Inventory adjustment references an unknown warehouse",
          entityType: "inventory_adjustment",
          entityId: adjustment.id,
        });
        continue;
      }

      const inventoryItem = inventoryItemById.get(adjustment.inventoryItemId);

      if (!inventoryItem) {
        issues.push({
          code: OPERATIONS_INTEGRITY_CODES.ADJUSTMENT_WAREHOUSE_MISMATCH,
          message: "Inventory adjustment references a missing inventory item",
          entityType: "inventory_adjustment",
          entityId: adjustment.id,
        });
        continue;
      }

      if (inventoryItem.warehouseId !== adjustment.warehouseId) {
        issues.push({
          code: OPERATIONS_INTEGRITY_CODES.ADJUSTMENT_WAREHOUSE_MISMATCH,
          message:
            "Inventory adjustment warehouse does not match inventory item warehouse",
          entityType: "inventory_adjustment",
          entityId: adjustment.id,
        });
      }
    }

    const latestAdjustmentByItemId = new Map<string, (typeof context.inventoryAdjustments)[number]>();

    for (const adjustment of context.inventoryAdjustments) {
      const existing = latestAdjustmentByItemId.get(adjustment.inventoryItemId);

      if (
        !existing ||
        adjustment.createdAt.localeCompare(existing.createdAt) > 0
      ) {
        latestAdjustmentByItemId.set(adjustment.inventoryItemId, adjustment);
      }
    }

    for (const [inventoryItemId, adjustment] of latestAdjustmentByItemId) {
      const inventoryItem = inventoryItemById.get(inventoryItemId);

      if (
        inventoryItem &&
        inventoryItem.quantityOnHand !== adjustment.newQuantityOnHand
      ) {
        issues.push({
          code: OPERATIONS_INTEGRITY_CODES.ADJUSTMENT_WAREHOUSE_MISMATCH,
          message:
            "Inventory quantity does not match the latest adjustment record",
          entityType: "inventory_adjustment",
          entityId: adjustment.id,
        });
      }
    }

    return issues;
  }

  private validateReplenishmentAfterReceiving(
    context: OperationsContext,
  ): IntegrityIssue[] {
    const issues: IntegrityIssue[] = [];
    const inventoryByWarehouseVariant = new Map<string, number>();

    for (const item of context.inventoryItems) {
      inventoryByWarehouseVariant.set(
        `${item.warehouseId}:${item.productVariantId}`,
        item.quantityOnHand,
      );
    }

    const returnAffectedKeys = this.buildReturnAffectedWarehouseVariantKeys(context);

    const receivedPurchaseOrders = context.purchaseOrders.filter(
      (purchaseOrder) =>
        purchaseOrder.status === "received" ||
        purchaseOrder.status === "partially_received",
    );

    for (const recommendation of context.replenishmentRecommendations) {
      if (recommendation.status !== "pending") {
        continue;
      }

      const key = `${recommendation.warehouseId}:${recommendation.productVariantId}`;

      if (returnAffectedKeys.has(key)) {
        continue;
      }

      const currentQuantity = inventoryByWarehouseVariant.get(key) ?? 0;

      if (currentQuantity !== recommendation.currentQuantity) {
        const linkedReceivedPo = recommendation.purchaseOrderId
          ? receivedPurchaseOrders.some(
              (purchaseOrder) => purchaseOrder.id === recommendation.purchaseOrderId,
            )
          : false;

        if (linkedReceivedPo || currentQuantity > recommendation.currentQuantity) {
          issues.push({
            code: OPERATIONS_INTEGRITY_CODES.PO_REPLENISHMENT_STALE,
            message:
              "Pending replenishment recommendation does not reflect current inventory after receiving",
            entityType: "replenishment_recommendation",
            entityId: recommendation.id,
          });
        }
      }
    }

    return issues;
  }

  private buildReturnAffectedWarehouseVariantKeys(
    context: OperationsContext,
  ): Set<string> {
    const keys = new Set<string>();
    const inventoryItemById = new Map(
      context.inventoryItems.map((item) => [item.id, item]),
    );

    for (const record of context.returns) {
      if (record.status !== "completed") {
        continue;
      }

      for (const item of record.items) {
        if (item.quantityRestocked <= 0) {
          continue;
        }

        const inventoryItem = inventoryItemById.get(item.inventoryItemId);

        if (inventoryItem) {
          keys.add(
            `${inventoryItem.warehouseId}:${inventoryItem.productVariantId}`,
          );
        }
      }
    }

    return keys;
  }

  private validateReturnReplenishmentInteraction(
    context: OperationsContext,
  ): IntegrityIssue[] {
    const issues: IntegrityIssue[] = [];
    const completedReturns = context.returns.filter(
      (record) => record.status === "completed",
    );

    if (completedReturns.length === 0) {
      return issues;
    }

    const inventoryByWarehouseVariant = new Map<string, number>();

    for (const item of context.inventoryItems) {
      inventoryByWarehouseVariant.set(
        `${item.warehouseId}:${item.productVariantId}`,
        item.quantityOnHand,
      );
    }

    const returnedInventoryItemIds = new Set<string>();

    for (const record of completedReturns) {
      for (const item of record.items) {
        returnedInventoryItemIds.add(item.inventoryItemId);
      }
    }

    for (const recommendation of context.replenishmentRecommendations) {
      if (recommendation.status !== "pending") {
        continue;
      }

      const inventoryItem = context.inventoryItems.find(
        (item) =>
          item.warehouseId === recommendation.warehouseId &&
          item.productVariantId === recommendation.productVariantId,
      );

      if (!inventoryItem || !returnedInventoryItemIds.has(inventoryItem.id)) {
        continue;
      }

      const key = `${recommendation.warehouseId}:${recommendation.productVariantId}`;
      const currentQuantity = inventoryByWarehouseVariant.get(key) ?? 0;

      if (
        currentQuantity >= recommendation.reorderPoint &&
        recommendation.currentQuantity < recommendation.reorderPoint
      ) {
        issues.push({
          code: OPERATIONS_INTEGRITY_CODES.RETURN_REPLENISHMENT_MISMATCH,
          message:
            "Returned inventory is not reflected in replenishment recommendation calculations",
          entityType: "replenishment_recommendation",
          entityId: recommendation.id,
        });
      }
    }

    return issues;
  }

  private validateCycleCountReplenishment(
    context: OperationsContext,
  ): IntegrityIssue[] {
    const issues: IntegrityIssue[] = [];
    const approvedCycleCounts = context.cycleCounts.filter(
      (cycleCount) => cycleCount.status === "approved",
    );

    if (approvedCycleCounts.length === 0) {
      return issues;
    }

    const inventoryByWarehouseVariant = new Map<string, number>();

    for (const item of context.inventoryItems) {
      inventoryByWarehouseVariant.set(
        `${item.warehouseId}:${item.productVariantId}`,
        item.quantityOnHand,
      );
    }

    for (const recommendation of context.replenishmentRecommendations) {
      if (recommendation.status !== "pending") {
        continue;
      }

      const hasApprovedCount = approvedCycleCounts.some(
        (cycleCount) => cycleCount.warehouseId === recommendation.warehouseId,
      );

      if (!hasApprovedCount) {
        continue;
      }

      const key = `${recommendation.warehouseId}:${recommendation.productVariantId}`;
      const currentQuantity = inventoryByWarehouseVariant.get(key) ?? 0;

      if (currentQuantity !== recommendation.currentQuantity) {
        issues.push({
          code: OPERATIONS_INTEGRITY_CODES.CYCLE_COUNT_REPLENISHMENT_STALE,
          message:
            "Replenishment recommendation is stale after approved cycle count",
          entityType: "replenishment_recommendation",
          entityId: recommendation.id,
        });
      }
    }

    return issues;
  }
}
