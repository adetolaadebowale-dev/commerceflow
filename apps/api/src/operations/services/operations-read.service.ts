import type {
  FulfillmentDashboard,
  IntegrityCheckResult,
  InventoryHealthSummary,
  ProcurementDashboard,
  WarehouseOperationalSummary,
} from "@commerceflow/types";

import type { OperationsContext } from "../providers/operations-context";
import { countByStatus } from "./operations-utils";

export class OperationsReadService {
  buildWarehouseOperationalSummary(
    context: OperationsContext,
  ): WarehouseOperationalSummary {
    const activeWarehouseCount = context.warehouses.filter(
      (warehouse) => warehouse.status === "active",
    ).length;
    const inTransitTransferCount = context.warehouseTransfers.filter(
      (transfer) => transfer.status === "in_transit",
    ).length;
    const pendingTransferCount = context.warehouseTransfers.filter(
      (transfer) => transfer.status === "draft" || transfer.status === "approved",
    ).length;
    const activeShipmentCount = context.shipments.filter(
      (shipment) =>
        shipment.status !== "delivered" && shipment.status !== "cancelled",
    ).length;

    return {
      storeId: context.storeId,
      generatedAt: new Date().toISOString(),
      warehouseCount: context.warehouses.length,
      activeWarehouseCount,
      inTransitTransferCount,
      pendingTransferCount,
      activeShipmentCount,
    };
  }

  buildFulfillmentDashboard(context: OperationsContext): FulfillmentDashboard {
    const openAllocationCount = context.allocations.filter(
      (allocation) =>
        allocation.status !== "fulfilled" && allocation.status !== "shortage",
    ).length;

    return {
      storeId: context.storeId,
      generatedAt: new Date().toISOString(),
      shipmentsByStatus: countByStatus(context.shipments),
      pickListsByStatus: countByStatus(context.pickLists),
      allocationsByStatus: countByStatus(context.allocations),
      pendingShipmentCount: context.shipments.filter(
        (shipment) => shipment.status === "pending",
      ).length,
      packedShipmentCount: context.shipments.filter(
        (shipment) => shipment.status === "packed",
      ).length,
      openAllocationCount,
    };
  }

  buildProcurementDashboard(context: OperationsContext): ProcurementDashboard {
    return {
      storeId: context.storeId,
      generatedAt: new Date().toISOString(),
      purchaseOrdersByStatus: countByStatus(context.purchaseOrders),
      pendingRecommendationCount: context.replenishmentRecommendations.filter(
        (recommendation) => recommendation.status === "pending",
      ).length,
      activeReplenishmentRuleCount: context.replenishmentRules.filter(
        (rule) => rule.isEnabled,
      ).length,
      draftPurchaseOrderCount: context.purchaseOrders.filter(
        (purchaseOrder) => purchaseOrder.status === "draft",
      ).length,
      activeSupplierCount: context.suppliers.filter(
        (supplier) => supplier.status === "active",
      ).length,
    };
  }

  buildInventoryHealthSummary(
    context: OperationsContext,
  ): InventoryHealthSummary {
    const rulesByWarehouseVariant = new Map(
      context.replenishmentRules
        .filter((rule) => rule.isEnabled)
        .map((rule) => [
          `${rule.warehouseId}:${rule.productVariantId}`,
          rule.reorderPoint,
        ]),
    );

    let lowStockItemCount = 0;

    for (const item of context.inventoryItems) {
      const reorderPoint = rulesByWarehouseVariant.get(
        `${item.warehouseId}:${item.productVariantId}`,
      );

      if (reorderPoint !== undefined && item.quantityOnHand <= reorderPoint) {
        lowStockItemCount += 1;
      }
    }

    return {
      storeId: context.storeId,
      generatedAt: new Date().toISOString(),
      inventoryItemCount: context.inventoryItems.length,
      lowStockItemCount,
      negativeQuantityItemCount: context.inventoryItems.filter(
        (item) => item.quantityOnHand < 0,
      ).length,
      activeReservationCount: context.reservations.filter(
        (reservation) => reservation.status === "active",
      ).length,
      openCycleCountCount: context.cycleCounts.filter(
        (cycleCount) =>
          cycleCount.status === "draft" || cycleCount.status === "counting",
      ).length,
      pendingAdjustmentCount: 0,
    };
  }
}

export type {
  FulfillmentDashboard,
  IntegrityCheckResult,
  InventoryHealthSummary,
  ProcurementDashboard,
  WarehouseOperationalSummary,
};
