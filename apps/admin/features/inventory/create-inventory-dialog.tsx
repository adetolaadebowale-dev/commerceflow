"use client";

import Link from "next/link";
import type { ProductVariant } from "@commerceflow/types";
import { createInventoryItemSchema } from "@commerceflow/validation";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveWarehouses } from "@/features/inventory/use-active-warehouses";
import { mapApiValidationErrors } from "@/features/products/map-api-validation-errors";
import { getVariantDisplayName } from "@/features/products/variants/variant-form-schema";
import { AdminApiError } from "@/types/api";

const createInventoryFormSchema = createInventoryItemSchema
  .omit({ storeId: true })
  .extend({
    initialQuantity: z.coerce
      .number()
      .int("Initial quantity must be a whole number")
      .min(0, "Initial quantity cannot be negative"),
  });

type CreateInventoryFormValues = z.infer<typeof createInventoryFormSchema>;

export interface CreateInventoryDialogProps {
  readonly open: boolean;
  readonly storeId: string;
  readonly variants: readonly ProductVariant[];
  readonly isSubmitting?: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSubmit: (input: {
    warehouseId: string;
    productVariantId: string;
    initialQuantity: number;
  }) => Promise<void>;
}

export function CreateInventoryDialog({
  open,
  storeId,
  variants,
  isSubmitting = false,
  onOpenChange,
  onSubmit,
}: CreateInventoryDialogProps) {
  const warehousesQuery = useActiveWarehouses(open ? storeId : null);
  const warehouses = warehousesQuery.data?.items ?? [];
  const preferredWarehouseId =
    warehouses.find((warehouse) => warehouse.isDefault)?.id ??
    warehouses[0]?.id ??
    "";

  const form = useForm<CreateInventoryFormValues>({
    resolver: zodResolver(createInventoryFormSchema),
    defaultValues: {
      warehouseId: "",
      productVariantId: variants[0]?.id ?? "",
      initialQuantity: 0,
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
    if (!open) {
      return;
    }
    reset({
      warehouseId: preferredWarehouseId,
      productVariantId: variants[0]?.id ?? "",
      initialQuantity: 0,
    });
  }, [open, variants, preferredWarehouseId, reset]);

  useEffect(() => {
    if (!open || !preferredWarehouseId) {
      return;
    }
    form.setValue("warehouseId", preferredWarehouseId, {
      shouldValidate: false,
      shouldDirty: false,
    });
  }, [open, preferredWarehouseId, form]);

  const showNoWarehouses =
    warehousesQuery.isSuccess && warehouses.length === 0;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Create inventory</ModalTitle>
          <ModalDescription>
            Initialize stock tracking for a product variant in a warehouse.
          </ModalDescription>
        </ModalHeader>

        {warehousesQuery.isLoading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading warehouses">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : warehousesQuery.isError ? (
          <div className="space-y-3">
            <ErrorState
              title="Unable to load warehouses"
              message={
                warehousesQuery.error instanceof AdminApiError
                  ? warehousesQuery.error.message
                  : "Unable to load warehouses."
              }
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => warehousesQuery.refetch()}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : showNoWarehouses ? (
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-muted-foreground)]">
              You must create a warehouse before inventory can be initialized.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button asChild>
                <Link href="/dashboard/warehouses">Go to Warehouses</Link>
              </Button>
            </div>
          </div>
        ) : variants.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Create a product variant before initializing inventory.
            </p>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={handleSubmit(async (values) => {
              try {
                await onSubmit({
                  warehouseId: values.warehouseId,
                  productVariantId: values.productVariantId,
                  initialQuantity: values.initialQuantity,
                });
                onOpenChange(false);
              } catch (error) {
                const mapped = mapApiValidationErrors(error);
                for (const [field, message] of Object.entries(
                  mapped.fieldErrors,
                )) {
                  if (message) {
                    setError(field as keyof CreateInventoryFormValues, {
                      message,
                    });
                  }
                }
                if (
                  error instanceof AdminApiError &&
                  error.code === "INVENTORY_ALREADY_EXISTS"
                ) {
                  setError("root", { message: error.message });
                } else {
                  setError("root", { message: mapped.formMessage });
                }
              }
            })}
            noValidate
          >
            {errors.root?.message ? (
              <ErrorState
                title="Unable to create inventory"
                message={errors.root.message}
              />
            ) : null}

            <div className="space-y-2">
              <label htmlFor="inventory-variant" className="text-sm font-medium">
                Variant
              </label>
              <Controller
                control={control}
                name="productVariantId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting || variants.length === 1}
                  >
                    <SelectTrigger
                      id="inventory-variant"
                      aria-invalid={Boolean(errors.productVariantId)}
                    >
                      <SelectValue placeholder="Select variant" />
                    </SelectTrigger>
                    <SelectContent>
                      {variants.map((variant) => (
                        <SelectItem key={variant.id} value={variant.id}>
                          {variant.sku} — {getVariantDisplayName(variant)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.productVariantId ? (
                <p
                  className="text-sm text-[var(--color-destructive)]"
                  role="alert"
                >
                  {errors.productVariantId.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="inventory-warehouse" className="text-sm font-medium">
                Warehouse
              </label>
              <Controller
                control={control}
                name="warehouseId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger
                      id="inventory-warehouse"
                      aria-invalid={Boolean(errors.warehouseId)}
                    >
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                          {warehouse.isDefault ? " (Default)" : ""} —{" "}
                          {warehouse.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.warehouseId ? (
                <p
                  className="text-sm text-[var(--color-destructive)]"
                  role="alert"
                >
                  {errors.warehouseId.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="inventory-initial-quantity"
                className="text-sm font-medium"
              >
                Initial quantity
              </label>
              <Input
                id="inventory-initial-quantity"
                type="number"
                min={0}
                step={1}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.initialQuantity)}
                {...register("initialQuantity")}
              />
              {errors.initialQuantity ? (
                <p
                  className="text-sm text-[var(--color-destructive)]"
                  role="alert"
                >
                  {errors.initialQuantity.message}
                </p>
              ) : null}
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating…" : "Create inventory"}
              </Button>
            </div>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
