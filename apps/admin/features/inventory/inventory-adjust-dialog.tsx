"use client";

import { ADJUSTMENT_STOCK_MOVEMENT_REASONS } from "@commerceflow/types";
import { createInventoryAdjustmentSchema } from "@commerceflow/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mapApiValidationErrors } from "@/features/products/map-api-validation-errors";
import type { InventoryRow } from "@/features/inventory/inventory-mappers";

const adjustFormSchema = createInventoryAdjustmentSchema
  .omit({ storeId: true, inventoryItemId: true })
  .extend({
    movementQuantity: z.coerce
      .number()
      .int("Adjustment quantity must be a whole number")
      .refine((value) => value !== 0, "Adjustment quantity must not be zero"),
    reason: z.enum(ADJUSTMENT_STOCK_MOVEMENT_REASONS),
  });

type AdjustFormValues = z.infer<typeof adjustFormSchema>;

const REASON_LABELS: Record<
  (typeof ADJUSTMENT_STOCK_MOVEMENT_REASONS)[number],
  string
> = {
  manual_adjustment: "Manual adjustment",
  sale_reserved_ready: "Sale reserved ready",
};

export interface InventoryAdjustDialogProps {
  readonly open: boolean;
  readonly row: InventoryRow | null;
  readonly isSubmitting?: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSubmit: (input: {
    inventoryItemId: string;
    movementQuantity: number;
    reason: string;
    notes?: string;
  }) => Promise<void>;
}

export function InventoryAdjustDialog({
  open,
  row,
  isSubmitting = false,
  onOpenChange,
  onSubmit,
}: InventoryAdjustDialogProps) {
  const form = useForm<AdjustFormValues>({
    resolver: zodResolver(adjustFormSchema),
    defaultValues: {
      movementQuantity: 1,
      reason: "manual_adjustment",
      notes: "",
    },
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (open) {
      reset({
        movementQuantity: 1,
        reason: "manual_adjustment",
        notes: "",
      });
    }
  }, [open, row?.inventoryItemId, reset]);

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Adjust inventory</ModalTitle>
          <ModalDescription>
            {row
              ? `Update on-hand quantity for SKU ${row.sku}. Use a negative value to decrease stock.`
              : "Update on-hand quantity for this inventory item."}
          </ModalDescription>
        </ModalHeader>

        <form
          className="space-y-4"
          onSubmit={handleSubmit(async (values) => {
            if (!row) {
              return;
            }
            try {
              await onSubmit({
                inventoryItemId: row.inventoryItemId,
                movementQuantity: values.movementQuantity,
                reason: values.reason,
                notes: values.notes?.trim() ? values.notes.trim() : undefined,
              });
              onOpenChange(false);
            } catch (error) {
              const mapped = mapApiValidationErrors(error);
              for (const [field, message] of Object.entries(mapped.fieldErrors)) {
                if (message) {
                  setError(field as keyof AdjustFormValues, { message });
                }
              }
              setError("root", { message: mapped.formMessage });
            }
          })}
          noValidate
        >
          {errors.root?.message ? (
            <ErrorState
              title="Unable to adjust inventory"
              message={errors.root.message}
            />
          ) : null}

          <div className="space-y-2">
            <label htmlFor="movementQuantity" className="text-sm font-medium">
              Adjustment quantity (+/-)
            </label>
            <Input
              id="movementQuantity"
              type="number"
              step={1}
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.movementQuantity)}
              {...register("movementQuantity")}
            />
            {errors.movementQuantity ? (
              <p className="text-sm text-[var(--color-destructive)]" role="alert">
                {errors.movementQuantity.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="adjust-reason" className="text-sm font-medium">
              Reason
            </label>
            <Controller
              control={control}
              name="reason"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="adjust-reason">
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {ADJUSTMENT_STOCK_MOVEMENT_REASONS.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {REASON_LABELS[reason]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.reason ? (
              <p className="text-sm text-[var(--color-destructive)]" role="alert">
                {errors.reason.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="adjust-notes" className="text-sm font-medium">
              Notes (optional)
            </label>
            <Input
              id="adjust-notes"
              disabled={isSubmitting}
              {...register("notes")}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !row}>
              {isSubmitting ? "Saving…" : "Save adjustment"}
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}
