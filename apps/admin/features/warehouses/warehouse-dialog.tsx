"use client";

import type { Warehouse } from "@commerceflow/types";

import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { WarehouseForm } from "@/features/warehouses/warehouse-form";
import type { WarehouseFormValues } from "@/features/warehouses/warehouse-form-schema";

export interface WarehouseDialogProps {
  readonly open: boolean;
  readonly mode: "create" | "edit";
  readonly warehouse?: Warehouse | null;
  readonly isSubmitting?: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSubmit: (values: WarehouseFormValues) => Promise<void>;
}

export function WarehouseDialog({
  open,
  mode,
  warehouse,
  isSubmitting = false,
  onOpenChange,
  onSubmit,
}: WarehouseDialogProps) {
  const title = mode === "create" ? "Create warehouse" : "Edit warehouse";
  const description =
    mode === "create"
      ? "Add a store warehouse location for inventory."
      : "Update warehouse details and status.";

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-xl">
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          <ModalDescription>{description}</ModalDescription>
        </ModalHeader>
        <WarehouseForm
          warehouse={mode === "edit" ? warehouse : null}
          isSubmitting={isSubmitting}
          submitLabel={mode === "create" ? "Create warehouse" : "Save changes"}
          onCancel={() => onOpenChange(false)}
          onSubmit={onSubmit}
        />
      </ModalContent>
    </Modal>
  );
}
