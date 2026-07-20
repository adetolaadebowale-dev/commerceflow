"use client";

import type { ProductVariant } from "@commerceflow/types";

import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { VariantForm } from "@/features/products/variants/variant-form";
import type { VariantFormValues } from "@/features/products/variants/variant-form-schema";

export interface VariantDialogProps {
  readonly open: boolean;
  readonly mode: "create" | "edit";
  readonly variant?: ProductVariant | null;
  readonly isSubmitting?: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSubmit: (values: VariantFormValues) => Promise<void>;
}

export function VariantDialog({
  open,
  mode,
  variant,
  isSubmitting = false,
  onOpenChange,
  onSubmit,
}: VariantDialogProps) {
  const title = mode === "create" ? "Create variant" : "Edit variant";
  const description =
    mode === "create"
      ? "Add a purchasable SKU with price and attributes."
      : "Update SKU, price, currency, and attributes.";

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-xl">
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          <ModalDescription>{description}</ModalDescription>
        </ModalHeader>
        <VariantForm
          variant={mode === "edit" ? variant : null}
          isSubmitting={isSubmitting}
          submitLabel={mode === "create" ? "Create variant" : "Save changes"}
          onCancel={() => onOpenChange(false)}
          onSubmit={onSubmit}
        />
      </ModalContent>
    </Modal>
  );
}
