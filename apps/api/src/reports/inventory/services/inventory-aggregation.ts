import type {
  InventoryAdjustmentSummary,
  InventoryMetrics,
  InventoryMovementReportRow,
  InventoryMovementTotals,
  InventoryVariantReport,
  InventoryWarehouseReport,
  InventoryValuationReportItem,
  LowStockReportItem,
  StockMovementType,
} from "@commerceflow/types";
import { STOCK_MOVEMENT_TYPES } from "@commerceflow/types";

import {
  formatCurrencyAmount,
  groupItems,
  parseCurrencyAmount,
  sumCurrencyAmounts,
} from "../../services/report-utils";
import { mapMovementToReportRow } from "../mappers/inventory-report.mapper";
import type {
  InventoryItemFact,
  InventoryMovementFact,
} from "../repositories/inventory-report.repository";

export function multiplyCurrencyAmount(unitCost: string, quantity: number): string {
  if (quantity === 0) {
    return "0.00";
  }

  const cents = parseCurrencyAmount(unitCost) * BigInt(quantity);
  return formatCurrencyAmount(cents);
}

export function buildInventoryMetrics(
  facts: readonly InventoryItemFact[],
  movementFacts: readonly InventoryMovementFact[],
  currency: string,
): InventoryMetrics {
  const inventoryValues = facts.map((fact) =>
    multiplyCurrencyAmount(fact.unitCost, fact.quantityOnHand),
  );

  return {
    quantityOnHand: sumField(facts, "quantityOnHand"),
    quantityReserved: sumField(facts, "quantityReserved"),
    quantityAllocated: sumField(facts, "quantityAllocated"),
    quantityAvailable: sumField(facts, "quantityAvailable"),
    quantityIncoming: sumField(facts, "quantityIncoming"),
    quantityOutgoing: sumField(facts, "quantityOutgoing"),
    inventoryValue: sumCurrencyAmounts(inventoryValues),
    stockMovementTotal: movementFacts.reduce(
      (total, movement) => total + movement.quantity,
      0,
    ),
    adjustmentTotal: movementFacts
      .filter((movement) => movement.movementType === "adjustment")
      .reduce((total, movement) => total + movement.quantity, 0),
    currency,
  };
}

export function buildWarehouseBreakdowns(
  facts: readonly InventoryItemFact[],
): readonly InventoryWarehouseReport[] {
  const groups = groupItems(
    facts.map((fact) => ({ ...fact, warehouseId: fact.warehouseId })),
    "warehouseId",
  );

  return [...groups.entries()]
    .map(([warehouseId, groupedFacts]) => {
      const typedFacts = groupedFacts as InventoryItemFact[];
      const inventoryValues = typedFacts.map((fact) =>
        multiplyCurrencyAmount(fact.unitCost, fact.quantityOnHand),
      );

      return {
        warehouseId,
        quantityOnHand: sumField(typedFacts, "quantityOnHand"),
        quantityReserved: sumField(typedFacts, "quantityReserved"),
        quantityAllocated: sumField(typedFacts, "quantityAllocated"),
        quantityAvailable: sumField(typedFacts, "quantityAvailable"),
        quantityIncoming: sumField(typedFacts, "quantityIncoming"),
        quantityOutgoing: sumField(typedFacts, "quantityOutgoing"),
        inventoryValue: sumCurrencyAmounts(inventoryValues),
        itemCount: typedFacts.length,
      };
    })
    .sort((left, right) => left.warehouseId.localeCompare(right.warehouseId));
}

export function buildVariantBreakdowns(
  facts: readonly InventoryItemFact[],
): readonly InventoryVariantReport[] {
  return facts
    .map((fact) => ({
      warehouseId: fact.warehouseId,
      productVariantId: fact.productVariantId,
      quantityOnHand: fact.quantityOnHand,
      quantityReserved: fact.quantityReserved,
      quantityAllocated: fact.quantityAllocated,
      quantityAvailable: fact.quantityAvailable,
      quantityIncoming: fact.quantityIncoming,
      quantityOutgoing: fact.quantityOutgoing,
      inventoryValue: multiplyCurrencyAmount(fact.unitCost, fact.quantityOnHand),
    }))
    .sort((left, right) =>
      `${left.warehouseId}:${left.productVariantId}`.localeCompare(
        `${right.warehouseId}:${right.productVariantId}`,
      ),
    );
}

export function buildAdjustmentSummary(
  movementFacts: readonly InventoryMovementFact[],
): InventoryAdjustmentSummary {
  const adjustments = movementFacts.filter(
    (movement) => movement.movementType === "adjustment",
  );
  const positiveAdjustmentQuantity = adjustments
    .filter((movement) => movement.quantity > 0)
    .reduce((total, movement) => total + movement.quantity, 0);
  const negativeAdjustmentQuantity = adjustments
    .filter((movement) => movement.quantity < 0)
    .reduce((total, movement) => total + Math.abs(movement.quantity), 0);

  return {
    adjustmentCount: adjustments.length,
    netAdjustmentQuantity: adjustments.reduce(
      (total, movement) => total + movement.quantity,
      0,
    ),
    positiveAdjustmentQuantity,
    negativeAdjustmentQuantity,
  };
}

export function buildMovementTotals(
  movementFacts: readonly InventoryMovementFact[],
): InventoryMovementTotals {
  const byMovementType = Object.fromEntries(
    STOCK_MOVEMENT_TYPES.map((movementType) => [
      movementType,
      movementFacts
        .filter((movement) => movement.movementType === movementType)
        .reduce((total, movement) => total + movement.quantity, 0),
    ]),
  ) as Record<StockMovementType, number>;

  const quantityIn = movementFacts
    .filter((movement) => movement.quantity > 0)
    .reduce((total, movement) => total + movement.quantity, 0);
  const quantityOut = movementFacts
    .filter((movement) => movement.quantity < 0)
    .reduce((total, movement) => total + Math.abs(movement.quantity), 0);

  return {
    movementCount: movementFacts.length,
    netQuantity: movementFacts.reduce(
      (total, movement) => total + movement.quantity,
      0,
    ),
    quantityIn,
    quantityOut,
    adjustmentTotal: byMovementType.adjustment ?? 0,
    byMovementType,
  };
}

export function buildLowStockItems(
  facts: readonly InventoryItemFact[],
): readonly LowStockReportItem[] {
  return facts
    .filter(
      (fact) =>
        fact.reorderPoint !== undefined &&
        fact.quantityOnHand <= fact.reorderPoint,
    )
    .map((fact) => ({
      inventoryItemId: fact.inventoryItemId,
      warehouseId: fact.warehouseId,
      productVariantId: fact.productVariantId,
      quantityOnHand: fact.quantityOnHand,
      quantityAvailable: fact.quantityAvailable,
      reorderPoint: fact.reorderPoint!,
      reorderQuantity: fact.reorderQuantity ?? 0,
      supplierId: fact.supplierId,
    }))
    .sort((left, right) =>
      `${left.warehouseId}:${left.productVariantId}`.localeCompare(
        `${right.warehouseId}:${right.productVariantId}`,
      ),
    );
}

export function buildOutOfStockItems(
  facts: readonly InventoryItemFact[],
): readonly LowStockReportItem[] {
  return facts
    .filter((fact) => fact.quantityAvailable <= 0)
    .map((fact) => ({
      inventoryItemId: fact.inventoryItemId,
      warehouseId: fact.warehouseId,
      productVariantId: fact.productVariantId,
      quantityOnHand: fact.quantityOnHand,
      quantityAvailable: fact.quantityAvailable,
      reorderPoint: fact.reorderPoint ?? 0,
      reorderQuantity: fact.reorderQuantity ?? 0,
      supplierId: fact.supplierId,
    }))
    .sort((left, right) =>
      `${left.warehouseId}:${left.productVariantId}`.localeCompare(
        `${right.warehouseId}:${right.productVariantId}`,
      ),
    );
}

export function buildValuationItems(
  facts: readonly InventoryItemFact[],
): readonly InventoryValuationReportItem[] {
  return facts
    .map((fact) => ({
      inventoryItemId: fact.inventoryItemId,
      warehouseId: fact.warehouseId,
      productVariantId: fact.productVariantId,
      quantityOnHand: fact.quantityOnHand,
      unitCost: fact.unitCost,
      inventoryValue: multiplyCurrencyAmount(fact.unitCost, fact.quantityOnHand),
      currency: fact.currency,
    }))
    .sort((left, right) =>
      `${left.warehouseId}:${left.productVariantId}`.localeCompare(
        `${right.warehouseId}:${right.productVariantId}`,
      ),
    );
}

export function mapMovementFactsToRows(
  movementFacts: readonly InventoryMovementFact[],
): readonly InventoryMovementReportRow[] {
  return movementFacts.map((fact) => mapMovementToReportRow(fact));
}

function sumField(
  items: readonly InventoryItemFact[],
  field:
    | "quantityOnHand"
    | "quantityReserved"
    | "quantityAllocated"
    | "quantityAvailable"
    | "quantityIncoming"
    | "quantityOutgoing",
): number {
  return items.reduce((total, item) => total + item[field], 0);
}
