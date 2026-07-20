"use client";

import type { Customer } from "@commerceflow/types";

import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { CustomerForm } from "@/features/customers/customer-form";
import type { CustomerFormValues } from "@/features/customers/customer-form-schema";

export interface CustomerDialogProps {
  readonly open: boolean;
  readonly mode: "create" | "edit";
  readonly customer?: Customer | null;
  readonly isSubmitting?: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSubmit: (values: CustomerFormValues) => Promise<void>;
}

export function CustomerDialog({
  open,
  mode,
  customer,
  isSubmitting = false,
  onOpenChange,
  onSubmit,
}: CustomerDialogProps) {
  const title = mode === "create" ? "Create customer" : "Edit customer";
  const description =
    mode === "create"
      ? "Add a store customer profile."
      : "Update customer details and status.";

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-lg">
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          <ModalDescription>{description}</ModalDescription>
        </ModalHeader>
        <CustomerForm
          mode={mode}
          customer={mode === "edit" ? customer : null}
          isSubmitting={isSubmitting}
          submitLabel={mode === "create" ? "Create customer" : "Save changes"}
          onCancel={() => onOpenChange(false)}
          onSubmit={onSubmit}
        />
      </ModalContent>
    </Modal>
  );
}
