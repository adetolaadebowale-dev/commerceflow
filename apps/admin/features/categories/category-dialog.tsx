"use client";

import type { Category } from "@commerceflow/types";

import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { CategoryForm } from "@/features/categories/category-form";
import type { CategoryFormValues } from "@/features/categories/category-form-schema";

export interface CategoryDialogProps {
  readonly open: boolean;
  readonly mode: "create" | "edit";
  readonly category?: Category | null;
  readonly parentOptions: readonly Category[];
  readonly isSubmitting?: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSubmit: (values: CategoryFormValues) => Promise<void>;
}

export function CategoryDialog({
  open,
  mode,
  category,
  parentOptions,
  isSubmitting = false,
  onOpenChange,
  onSubmit,
}: CategoryDialogProps) {
  const title = mode === "create" ? "Create category" : "Edit category";
  const description =
    mode === "create"
      ? "Add a category for catalogue products. Optionally nest under a parent."
      : "Update category details and parent assignment.";

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-lg">
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          <ModalDescription>{description}</ModalDescription>
        </ModalHeader>
        <CategoryForm
          mode={mode}
          category={mode === "edit" ? category : null}
          parentOptions={parentOptions}
          isSubmitting={isSubmitting}
          submitLabel={mode === "create" ? "Create category" : "Save changes"}
          onCancel={() => onOpenChange(false)}
          onSubmit={onSubmit}
        />
      </ModalContent>
    </Modal>
  );
}
