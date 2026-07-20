"use client";

import type { ProductVariant } from "@commerceflow/types";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VariantCard } from "@/features/products/variants/variant-card";
import { VariantDialog } from "@/features/products/variants/variant-dialog";
import type { VariantFormValues } from "@/features/products/variants/variant-form-schema";

export interface VariantListProps {
  readonly items: readonly ProductVariant[];
  readonly isLoading?: boolean;
  readonly isSaving?: boolean;
  readonly onCreate: (values: VariantFormValues) => Promise<void>;
  readonly onUpdate: (
    variantId: string,
    values: VariantFormValues,
  ) => Promise<void>;
  readonly onDelete: (variantId: string) => Promise<void>;
}

export function VariantList({
  items,
  isLoading = false,
  isSaving = false,
  onCreate,
  onUpdate,
  onDelete,
}: VariantListProps) {
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<ProductVariant | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ProductVariant | null>(
    null,
  );
  const [isConfirming, setIsConfirming] = useState(false);

  const canDelete = items.length > 1;

  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading variants">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => {
            setEditing(null);
            setDialogMode("create");
          }}
        >
          Add variant
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No variants yet"
          description="Create at least one variant with SKU, price, and attributes."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Variant Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead className="hidden lg:table-cell">
                Attribute Summary
              </TableHead>
              <TableHead className="hidden md:table-cell">Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((variant) => (
              <VariantCard
                key={variant.id}
                variant={variant}
                deleteDisabled={!canDelete || isSaving || isConfirming}
                onEdit={() => {
                  setEditing(variant);
                  setDialogMode("edit");
                }}
                onDelete={() => setPendingDelete(variant)}
              />
            ))}
          </TableBody>
        </Table>
      )}

      <VariantDialog
        open={dialogMode != null}
        mode={dialogMode === "edit" ? "edit" : "create"}
        variant={editing}
        isSubmitting={isSaving}
        onOpenChange={(open) => {
          if (!open) {
            setDialogMode(null);
            setEditing(null);
          }
        }}
        onSubmit={async (values) => {
          if (dialogMode === "edit" && editing) {
            await onUpdate(editing.id, values);
          } else {
            await onCreate(values);
          }
          setDialogMode(null);
          setEditing(null);
        }}
      />

      <Modal
        open={pendingDelete != null}
        onOpenChange={(open) => {
          if (!open && !isConfirming) {
            setPendingDelete(null);
          }
        }}
      >
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Delete variant</ModalTitle>
            <ModalDescription>
              {pendingDelete
                ? `Delete SKU “${pendingDelete.sku}”? This cannot be undone.`
                : "Delete this variant?"}
            </ModalDescription>
          </ModalHeader>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isConfirming}
              onClick={() => setPendingDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isConfirming}
              onClick={async () => {
                if (!pendingDelete) {
                  return;
                }
                setIsConfirming(true);
                try {
                  await onDelete(pendingDelete.id);
                  setPendingDelete(null);
                } finally {
                  setIsConfirming(false);
                }
              }}
            >
              {isConfirming ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </ModalContent>
      </Modal>
    </div>
  );
}
