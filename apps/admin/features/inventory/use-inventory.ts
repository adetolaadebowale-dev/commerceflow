"use client";

import { useQuery } from "@tanstack/react-query";
import type { ProductVariant } from "@commerceflow/types";

import { buildInventoryRows } from "@/features/inventory/inventory-mappers";
import {
  inventoryItemsQueryKey,
  inventorySummaryQueryKey,
} from "@/features/inventory/inventory-query-keys";
import {
  getInventorySummary,
  listInventoryItems,
} from "@/services/inventory.service";

export function useInventory(
  storeId: string | null,
  productId: string,
  variants: readonly ProductVariant[],
) {
  const variantIds = variants.map((variant) => variant.id);

  const itemsQuery = useQuery({
    queryKey: inventoryItemsQueryKey(storeId ?? "", productId),
    enabled: Boolean(storeId && productId && variantIds.length > 0),
    queryFn: async () => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      const pages = await Promise.all(
        variantIds.map((productVariantId) =>
          listInventoryItems({
            storeId,
            productVariantId,
            page: 1,
            limit: 100,
          }),
        ),
      );
      return pages.flatMap((page) => page.items);
    },
  });

  const summaryQuery = useQuery({
    queryKey: inventorySummaryQueryKey(storeId ?? "", productId),
    enabled: Boolean(storeId && productId && variantIds.length > 0),
    queryFn: async () => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return getInventorySummary({
        storeId,
        productVariantIds: variantIds,
      });
    },
  });

  const rows = buildInventoryRows({
    variants,
    items: itemsQuery.data ?? [],
    summary: summaryQuery.data ?? null,
  });

  return {
    rows,
    isLoading:
      variantIds.length > 0 &&
      (itemsQuery.isLoading || summaryQuery.isLoading),
    isError: itemsQuery.isError,
    error: itemsQuery.error,
    isSummaryError: summaryQuery.isError,
    refetch: async () => {
      await Promise.all([itemsQuery.refetch(), summaryQuery.refetch()]);
    },
  };
}
