"use client";

import { Button } from "@/components/ui/button";

export interface InventoryEmptyStateProps {
  readonly onCreate: () => void;
  readonly createDisabled?: boolean;
}

export function InventoryEmptyState({
  onCreate,
  createDisabled = false,
}: InventoryEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-accent)] px-6 py-12 text-center">
      <h3 className="text-base font-medium text-[var(--color-foreground)]">
        No inventory exists for this variant.
      </h3>
      <p className="mt-2 max-w-md text-sm text-[var(--color-muted-foreground)]">
        Create inventory to begin tracking stock.
      </p>
      <Button
        type="button"
        className="mt-6"
        disabled={createDisabled}
        onClick={onCreate}
      >
        Create Inventory
      </Button>
    </div>
  );
}
