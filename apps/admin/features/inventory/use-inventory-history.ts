"use client";

import { useQuery } from "@tanstack/react-query";

import { inventoryHistoryQueryKey } from "@/features/inventory/inventory-query-keys";
import {
  listInventoryAdjustments,
  listInventoryItemStockMovements,
} from "@/services/inventory.service";

export interface InventoryHistoryRow {
  readonly id: string;
  readonly createdAt: string;
  readonly quantityChange: number;
  readonly reason: string;
  readonly userLabel: string | null;
  readonly resultingQuantity: number | null;
}

export function useInventoryHistory(
  storeId: string | null,
  inventoryItemId: string | null,
  page = 1,
) {
  return useQuery({
    queryKey: inventoryHistoryQueryKey(
      storeId ?? "",
      inventoryItemId ?? "",
      page,
    ),
    enabled: Boolean(storeId && inventoryItemId),
    queryFn: async (): Promise<{
      rows: InventoryHistoryRow[];
      total: number;
      page: number;
      totalPages: number;
    }> => {
      if (!storeId || !inventoryItemId) {
        throw new Error("Store id and inventory item id are required");
      }

      const [movements, adjustments] = await Promise.all([
        listInventoryItemStockMovements(inventoryItemId, {
          storeId,
          page,
          limit: 10,
        }),
        listInventoryAdjustments({
          storeId,
          inventoryItemId,
          page: 1,
          limit: 100,
        }),
      ]);

      const adjustmentsByNumber = new Map(
        adjustments.items.map((adjustment) => [
          adjustment.adjustmentNumber,
          adjustment,
        ]),
      );

      const rows: InventoryHistoryRow[] = movements.items.map((movement) => {
        const metadataReason =
          movement.metadata &&
          typeof movement.metadata === "object" &&
          typeof (movement.metadata as { reason?: unknown }).reason === "string"
            ? (movement.metadata as { reason: string }).reason
            : null;
        const matchedAdjustment = movement.reference
          ? adjustmentsByNumber.get(movement.reference)
          : undefined;

        return {
          id: movement.id,
          createdAt: movement.createdAt,
          quantityChange: movement.quantity,
          reason:
            metadataReason ??
            matchedAdjustment?.reason ??
            movement.reference ??
            movement.movementType,
          userLabel: matchedAdjustment
            ? `User ${matchedAdjustment.createdByUserId.slice(0, 8)}`
            : null,
          resultingQuantity: movement.newQuantityOnHand,
        };
      });

      return {
        rows,
        total: movements.total,
        page: movements.page,
        totalPages: movements.totalPages,
      };
    },
  });
}
