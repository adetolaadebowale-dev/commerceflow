"use client";

import type { Brand } from "@commerceflow/types";

import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { BrandForm } from "@/features/brands/brand-form";
import type { BrandFormValues } from "@/features/brands/brand-form-schema";

export interface BrandDialogProps {
  readonly open: boolean;
  readonly mode: "create" | "edit";
  readonly brand?: Brand | null;
  readonly isSubmitting?: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSubmit: (values: BrandFormValues) => Promise<void>;
}

export function BrandDialog({
  open,
  mode,
  brand,
  isSubmitting = false,
  onOpenChange,
  onSubmit,
}: BrandDialogProps) {
  const title = mode === "create" ? "Create brand" : "Edit brand";
  const description =
    mode === "create"
      ? "Add a brand for catalogue products."
      : "Update brand name, slug, and description.";

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-lg">
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          <ModalDescription>{description}</ModalDescription>
        </ModalHeader>
        <BrandForm
          mode={mode}
          brand={mode === "edit" ? brand : null}
          isSubmitting={isSubmitting}
          submitLabel={mode === "create" ? "Create brand" : "Save changes"}
          onCancel={() => onOpenChange(false)}
          onSubmit={onSubmit}
        />
      </ModalContent>
    </Modal>
  );
}
