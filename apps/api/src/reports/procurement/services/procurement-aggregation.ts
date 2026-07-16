import type {
  FulfillmentAnalytics,
  ProcurementMetrics,
  PurchaseOrderAnalyticsSummary,
  PurchaseOrderStatusSummary,
  ReceivingAnalytics,
  ReplenishmentMetrics,
  SupplierAnalyticsSummary,
  TransferAnalytics,
  WarehouseAnalyticsSummary,
} from "@commerceflow/types";
import { PURCHASE_ORDER_STATUSES } from "@commerceflow/types";

import { multiplyCurrencyAmount } from "../../inventory/services/inventory-aggregation";
import { sumCurrencyAmounts } from "../../services/report-utils";
import type {
  ProcurementInventoryFact,
  ProcurementShipmentFact,
  ProcurementStockMovementFact,
  PurchaseOrderFact,
  PurchaseOrderLineFact,
  ReplenishmentRecommendationFact,
  SupplierFact,
  WarehouseFact,
  WarehouseTransferFact,
} from "../repositories/procurement-report.repository";

const ACTIVE_PURCHASE_ORDER_STATUSES = new Set([
  "ordered",
  "partially_received",
  "received",
]);

export function computePurchaseOrderLineTotals(
  items: readonly PurchaseOrderLineFact[],
): {
  readonly quantityOrdered: number;
  readonly quantityReceived: number;
  readonly totalValue: string;
  readonly currency: string;
} {
  const quantityOrdered = items.reduce(
    (total, item) => total + item.quantityOrdered,
    0,
  );
  const quantityReceived = items.reduce(
    (total, item) => total + item.quantityReceived,
    0,
  );
  const lineTotals = items.map((item) =>
    multiplyCurrencyAmount(item.unitCost, item.quantityOrdered),
  );

  return {
    quantityOrdered,
    quantityReceived,
    totalValue: lineTotals.length > 0 ? sumCurrencyAmounts(lineTotals) : "0.00",
    currency: items[0]?.currency ?? "USD",
  };
}

function formatRate(numerator: number, denominator: number): string {
  if (denominator === 0) {
    return "0.00";
  }

  return ((numerator / denominator) * 100).toFixed(2);
}

function isFullyReceived(fact: PurchaseOrderFact): boolean {
  const totals = computePurchaseOrderLineTotals(fact.items);
  return (
    totals.quantityOrdered > 0 && totals.quantityReceived >= totals.quantityOrdered
  );
}

function isPartiallyReceived(fact: PurchaseOrderFact): boolean {
  const totals = computePurchaseOrderLineTotals(fact.items);
  return (
    totals.quantityReceived > 0 && totals.quantityReceived < totals.quantityOrdered
  );
}

function isOnTimeReceiving(fact: PurchaseOrderFact): boolean {
  if (!fact.expectedDeliveryDate || !fact.receivedAt) {
    return false;
  }

  return fact.receivedAt.localeCompare(fact.expectedDeliveryDate) <= 0;
}

export function buildReceivingAnalytics(
  purchaseOrderFacts: readonly PurchaseOrderFact[],
): ReceivingAnalytics {
  const activeFacts = purchaseOrderFacts.filter((fact) =>
    ACTIVE_PURCHASE_ORDER_STATUSES.has(fact.status),
  );
  const totals = activeFacts.reduce(
    (accumulator, fact) => {
      const lineTotals = computePurchaseOrderLineTotals(fact.items);
      return {
        quantityOrdered:
          accumulator.quantityOrdered + lineTotals.quantityOrdered,
        quantityReceived:
          accumulator.quantityReceived + lineTotals.quantityReceived,
        fullyReceivedCount:
          accumulator.fullyReceivedCount + (isFullyReceived(fact) ? 1 : 0),
        partiallyReceivedCount:
          accumulator.partiallyReceivedCount +
          (isPartiallyReceived(fact) ? 1 : 0),
      };
    },
    {
      quantityOrdered: 0,
      quantityReceived: 0,
      fullyReceivedCount: 0,
      partiallyReceivedCount: 0,
    },
  );

  return {
    totalQuantityOrdered: totals.quantityOrdered,
    totalQuantityReceived: totals.quantityReceived,
    fullyReceivedPurchaseOrderCount: totals.fullyReceivedCount,
    partiallyReceivedPurchaseOrderCount: totals.partiallyReceivedCount,
    receivingRate: formatRate(
      totals.quantityReceived,
      totals.quantityOrdered,
    ),
    partialReceivingRate: formatRate(
      totals.partiallyReceivedCount,
      activeFacts.length,
    ),
  };
}

export function buildPurchaseOrderAnalyticsSummary(
  purchaseOrderFacts: readonly PurchaseOrderFact[],
  currency: string,
): PurchaseOrderAnalyticsSummary {
  const receivingAnalytics = buildReceivingAnalytics(purchaseOrderFacts);
  const purchaseOrderValue = sumCurrencyAmounts(
    purchaseOrderFacts.map(
      (fact) => computePurchaseOrderLineTotals(fact.items).totalValue,
    ),
  );
  const byStatus = PURCHASE_ORDER_STATUSES.map((status) => {
    const factsForStatus = purchaseOrderFacts.filter(
      (fact) => fact.status === status,
    );

    return {
      status,
      count: factsForStatus.length,
      totalValue: sumCurrencyAmounts(
        factsForStatus.map(
          (fact) => computePurchaseOrderLineTotals(fact.items).totalValue,
        ),
      ),
    } satisfies PurchaseOrderStatusSummary;
  }).filter((entry) => entry.count > 0);

  return {
    purchaseOrderCount: purchaseOrderFacts.length,
    purchaseOrderValue,
    quantityOrdered: receivingAnalytics.totalQuantityOrdered,
    quantityReceived: receivingAnalytics.totalQuantityReceived,
    receivingRate: receivingAnalytics.receivingRate,
    partialReceivingRate: receivingAnalytics.partialReceivingRate,
    currency,
    byStatus,
  };
}

export function buildTransferAnalytics(
  transferFacts: readonly WarehouseTransferFact[],
): TransferAnalytics {
  return {
    transferCount: transferFacts.length,
    transferVolume: transferFacts.reduce((total, fact) => total + fact.quantity, 0),
    inTransitCount: transferFacts.filter((fact) => fact.status === "in_transit")
      .length,
    receivedCount: transferFacts.filter((fact) => fact.status === "received")
      .length,
    pendingCount: transferFacts.filter(
      (fact) => fact.status === "draft" || fact.status === "approved",
    ).length,
  };
}

export function buildReplenishmentMetrics(
  recommendationFacts: readonly ReplenishmentRecommendationFact[],
): ReplenishmentMetrics {
  const pendingCount = recommendationFacts.filter(
    (fact) => fact.status === "pending",
  ).length;
  const acceptedCount = recommendationFacts.filter(
    (fact) => fact.status === "accepted",
  ).length;
  const dismissedCount = recommendationFacts.filter(
    (fact) => fact.status === "dismissed",
  ).length;
  const resolvedCount = acceptedCount + dismissedCount;

  return {
    recommendationCount: recommendationFacts.length,
    pendingCount,
    acceptedCount,
    dismissedCount,
    acceptanceRate: formatRate(acceptedCount, resolvedCount),
  };
}

export function buildFulfillmentAnalytics(
  shipmentFacts: readonly ProcurementShipmentFact[],
): FulfillmentAnalytics {
  const shippedCount = shipmentFacts.filter(
    (fact) => fact.status === "shipped" || fact.status === "delivered",
  ).length;
  const deliveredCount = shipmentFacts.filter(
    (fact) => fact.status === "delivered",
  ).length;
  const pendingCount = shipmentFacts.filter((fact) => fact.status === "pending")
    .length;

  return {
    fulfillmentVolume: shippedCount + deliveredCount,
    shipmentCount: shipmentFacts.length,
    shippedCount,
    deliveredCount,
    pendingCount,
  };
}

export function buildSupplierAnalyticsSummary(
  supplierFacts: readonly SupplierFact[],
  purchaseOrderFacts: readonly PurchaseOrderFact[],
  currency: string,
): SupplierAnalyticsSummary {
  const purchaseVolume = sumCurrencyAmounts(
    purchaseOrderFacts.map(
      (fact) => computePurchaseOrderLineTotals(fact.items).totalValue,
    ),
  );
  const onTimeRates = supplierFacts.map((supplier) =>
    computeSupplierOnTimeReceivingRate(
      supplier.supplierId,
      purchaseOrderFacts,
    ),
  );
  const averageOnTimeReceivingRate =
    onTimeRates.length === 0
      ? "0.00"
      : formatRate(
          onTimeRates.reduce((total, rate) => total + Number(rate), 0),
          onTimeRates.length,
        );

  return {
    supplierCount: supplierFacts.length,
    purchaseOrderCount: purchaseOrderFacts.length,
    purchaseVolume,
    averageOnTimeReceivingRate,
    currency,
  };
}

export function computeSupplierOnTimeReceivingRate(
  supplierId: string,
  purchaseOrderFacts: readonly PurchaseOrderFact[],
): string {
  const supplierOrders = purchaseOrderFacts.filter(
    (fact) => fact.supplierId === supplierId && fact.receivedAt,
  );
  const measurableOrders = supplierOrders.filter(
    (fact) => fact.expectedDeliveryDate !== undefined,
  );

  if (measurableOrders.length === 0) {
    return "0.00";
  }

  const onTimeCount = measurableOrders.filter(isOnTimeReceiving).length;
  return formatRate(onTimeCount, measurableOrders.length);
}

export function computeSupplierPurchaseVolume(
  supplierId: string,
  purchaseOrderFacts: readonly PurchaseOrderFact[],
): string {
  const supplierOrders = purchaseOrderFacts.filter(
    (fact) => fact.supplierId === supplierId,
  );

  return sumCurrencyAmounts(
    supplierOrders.map(
      (fact) => computePurchaseOrderLineTotals(fact.items).totalValue,
    ),
  );
}

export function computeWarehouseThroughput(
  warehouseId: string,
  movementFacts: readonly ProcurementStockMovementFact[],
): number {
  return movementFacts
    .filter((fact) => fact.warehouseId === warehouseId)
    .reduce((total, fact) => total + Math.abs(fact.quantity), 0);
}

export function computeWarehouseInventoryTurnover(
  warehouseId: string,
  movementFacts: readonly ProcurementStockMovementFact[],
  inventoryFacts: readonly ProcurementInventoryFact[],
): string {
  const outboundQuantity = movementFacts
    .filter(
      (fact) => fact.warehouseId === warehouseId && fact.quantity < 0,
    )
    .reduce((total, fact) => total + Math.abs(fact.quantity), 0);
  const warehouseInventory = inventoryFacts.filter(
    (fact) => fact.warehouseId === warehouseId,
  );
  const averageOnHand =
    warehouseInventory.length === 0
      ? 0
      : warehouseInventory.reduce(
          (total, fact) => total + fact.quantityOnHand,
          0,
        ) / warehouseInventory.length;

  return formatRate(outboundQuantity, averageOnHand);
}

export function computeWarehouseTransferVolume(
  warehouseId: string,
  transferFacts: readonly WarehouseTransferFact[],
): number {
  return transferFacts.reduce((total, fact) => {
    if (fact.sourceWarehouseId === warehouseId || fact.destinationWarehouseId === warehouseId) {
      return total + fact.quantity;
    }

    return total;
  }, 0);
}

export function computeWarehouseFulfillmentVolume(
  warehouseId: string,
  shipmentFacts: readonly ProcurementShipmentFact[],
): number {
  return shipmentFacts.filter(
    (fact) =>
      fact.warehouseId === warehouseId &&
      (fact.status === "shipped" || fact.status === "delivered"),
  ).length;
}

export function buildWarehouseAnalyticsSummary(
  warehouseFacts: readonly WarehouseFact[],
  movementFacts: readonly ProcurementStockMovementFact[],
  inventoryFacts: readonly ProcurementInventoryFact[],
  transferFacts: readonly WarehouseTransferFact[],
  shipmentFacts: readonly ProcurementShipmentFact[],
): WarehouseAnalyticsSummary {
  const turnoverRates = warehouseFacts.map((warehouse) =>
    Number(
      computeWarehouseInventoryTurnover(
        warehouse.warehouseId,
        movementFacts,
        inventoryFacts,
      ),
    ),
  );

  return {
    warehouseCount: warehouseFacts.length,
    totalThroughput: warehouseFacts.reduce(
      (total, warehouse) =>
        total +
        computeWarehouseThroughput(warehouse.warehouseId, movementFacts),
      0,
    ),
    averageInventoryTurnover:
      turnoverRates.length === 0
        ? "0.00"
        : formatRate(
            turnoverRates.reduce((total, rate) => total + rate, 0),
            turnoverRates.length,
          ),
    totalTransferVolume: transferFacts.reduce(
      (total, fact) => total + fact.quantity,
      0,
    ),
    totalFulfillmentVolume: buildFulfillmentAnalytics(shipmentFacts)
      .fulfillmentVolume,
  };
}

export function buildProcurementMetrics(
  purchaseOrderFacts: readonly PurchaseOrderFact[],
  transferFacts: readonly WarehouseTransferFact[],
  recommendationFacts: readonly ReplenishmentRecommendationFact[],
  shipmentFacts: readonly ProcurementShipmentFact[],
  currency: string,
): ProcurementMetrics {
  const purchaseOrderSummary = buildPurchaseOrderAnalyticsSummary(
    purchaseOrderFacts,
    currency,
  );
  const replenishmentMetrics = buildReplenishmentMetrics(recommendationFacts);
  const fulfillmentAnalytics = buildFulfillmentAnalytics(shipmentFacts);

  return {
    purchaseOrderCount: purchaseOrderSummary.purchaseOrderCount,
    purchaseOrderValue: purchaseOrderSummary.purchaseOrderValue,
    receivingRate: purchaseOrderSummary.receivingRate,
    partialReceivingRate: purchaseOrderSummary.partialReceivingRate,
    transferVolume: buildTransferAnalytics(transferFacts).transferVolume,
    replenishmentRecommendationCount: replenishmentMetrics.recommendationCount,
    recommendationAcceptanceRate: replenishmentMetrics.acceptanceRate,
    fulfillmentVolume: fulfillmentAnalytics.fulfillmentVolume,
    currency,
  };
}
