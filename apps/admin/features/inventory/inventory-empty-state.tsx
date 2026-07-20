"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export interface InventoryEmptyStateProps {
  readonly onCreate: () => void;
  readonly createDisabled?: boolean;
}

export function InventoryEmptyState({
  onCreate,
  createDisabled = false,
}: InventoryEmptyStateProps) {
  return (
    <EmptyState
      title="No inventory yet"
      description="Create inventory for a variant and warehouse to begin tracking stock."
      action={
        <Button type="button" disabled={createDisabled} onClick={onCreate}>
          Create Inventory
        </Button>
      }
    />
  );
}
