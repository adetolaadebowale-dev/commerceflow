"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Warehouse } from "@commerceflow/types";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mapApiValidationErrors } from "@/features/products/map-api-validation-errors";
import {
  WAREHOUSE_FORM_DEFAULTS,
  warehouseFormSchema,
  type WarehouseFormValues,
} from "@/features/warehouses/warehouse-form-schema";
import { AdminApiError } from "@/types/api";

export interface WarehouseFormProps {
  readonly warehouse?: Warehouse | null;
  readonly isSubmitting?: boolean;
  readonly onSubmit: (values: WarehouseFormValues) => Promise<void>;
  readonly onCancel: () => void;
  readonly submitLabel?: string;
}

function toDefaultValues(warehouse?: Warehouse | null): WarehouseFormValues {
  if (!warehouse) {
    return { ...WAREHOUSE_FORM_DEFAULTS };
  }

  return {
    name: warehouse.name,
    code: warehouse.code,
    address: warehouse.address,
    city: warehouse.city,
    stateProvince: warehouse.stateProvince,
    postalCode: warehouse.postalCode,
    countryCode: warehouse.countryCode,
    status: warehouse.status,
    isDefault: warehouse.isDefault,
  };
}

export function WarehouseForm({
  warehouse,
  isSubmitting = false,
  onSubmit,
  onCancel,
  submitLabel = "Save warehouse",
}: WarehouseFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const isDefaultWarehouse = warehouse?.isDefault === true;

  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseFormSchema),
    defaultValues: toDefaultValues(warehouse),
  });

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = form;

  const statusValue = watch("status");

  useEffect(() => {
    form.reset(toDefaultValues(warehouse));
    setFormError(null);
  }, [warehouse, form]);

  async function submit(values: WarehouseFormValues) {
    setFormError(null);

    try {
      await onSubmit(values);
    } catch (error) {
      const mapped = mapApiValidationErrors(error);
      for (const [field, message] of Object.entries(mapped.fieldErrors)) {
        if (message) {
          setError(field as keyof WarehouseFormValues, { message });
        }
      }

      if (error instanceof AdminApiError) {
        if (error.code === "WAREHOUSE_CODE_ALREADY_EXISTS") {
          setError("code", { message: error.message });
        }
        if (
          error.code === "WAREHOUSE_CANNOT_DEACTIVATE_DEFAULT" ||
          error.code === "WAREHOUSE_DEFAULT_REQUIRED"
        ) {
          setFormError(error.message);
          throw error;
        }
      }

      setFormError(mapped.formMessage);
      throw error;
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit(async (values) => {
        try {
          await submit(values);
        } catch {
          // Errors mapped onto form fields / formError.
        }
      })}
      noValidate
    >
      {formError ? (
        <ErrorState title="Unable to save warehouse" message={formError} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="warehouse-name" className="text-sm font-medium">
            Name
          </label>
          <Input
            id="warehouse-name"
            autoComplete="off"
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
          {errors.name ? (
            <p className="text-sm text-[var(--color-destructive)]" role="alert">
              {errors.name.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="warehouse-code" className="text-sm font-medium">
            Code
          </label>
          <Input
            id="warehouse-code"
            autoComplete="off"
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.code)}
            aria-describedby="warehouse-code-hint"
            {...register("code", {
              onChange: (event) => {
                const next = event.target.value.toUpperCase();
                setValue("code", next, { shouldValidate: true, shouldDirty: true });
              },
            })}
          />
          <p
            id="warehouse-code-hint"
            className="text-xs text-[var(--color-muted-foreground)]"
          >
            Uppercase letters, numbers, _ or -
          </p>
          {errors.code ? (
            <p className="text-sm text-[var(--color-destructive)]" role="alert">
              {errors.code.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="warehouse-status" className="text-sm font-medium">
            Status
          </label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isSubmitting || isDefaultWarehouse}
              >
                <SelectTrigger
                  id="warehouse-status"
                  aria-invalid={Boolean(errors.status)}
                >
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive" disabled={isDefaultWarehouse}>
                    Inactive
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {isDefaultWarehouse ? (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Default warehouses must stay active.
            </p>
          ) : null}
          {errors.status ? (
            <p className="text-sm text-[var(--color-destructive)]" role="alert">
              {errors.status.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="warehouse-address" className="text-sm font-medium">
            Address
          </label>
          <Input
            id="warehouse-address"
            autoComplete="street-address"
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.address)}
            {...register("address")}
          />
          {errors.address ? (
            <p className="text-sm text-[var(--color-destructive)]" role="alert">
              {errors.address.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="warehouse-city" className="text-sm font-medium">
            City
          </label>
          <Input
            id="warehouse-city"
            autoComplete="address-level2"
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.city)}
            {...register("city")}
          />
          {errors.city ? (
            <p className="text-sm text-[var(--color-destructive)]" role="alert">
              {errors.city.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="warehouse-state" className="text-sm font-medium">
            State / Province
          </label>
          <Input
            id="warehouse-state"
            autoComplete="address-level1"
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.stateProvince)}
            {...register("stateProvince")}
          />
          {errors.stateProvince ? (
            <p className="text-sm text-[var(--color-destructive)]" role="alert">
              {errors.stateProvince.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="warehouse-postal" className="text-sm font-medium">
            Postal code
          </label>
          <Input
            id="warehouse-postal"
            autoComplete="postal-code"
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.postalCode)}
            {...register("postalCode")}
          />
          {errors.postalCode ? (
            <p className="text-sm text-[var(--color-destructive)]" role="alert">
              {errors.postalCode.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="warehouse-country" className="text-sm font-medium">
            Country code
          </label>
          <Input
            id="warehouse-country"
            autoComplete="country"
            maxLength={2}
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.countryCode)}
            {...register("countryCode", {
              onChange: (event) => {
                const next = event.target.value.toUpperCase().slice(0, 2);
                setValue("countryCode", next, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              },
            })}
          />
          {errors.countryCode ? (
            <p className="text-sm text-[var(--color-destructive)]" role="alert">
              {errors.countryCode.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-md border border-[var(--color-border)] p-3">
        <input
          id="warehouse-default"
          type="checkbox"
          className="mt-1 h-4 w-4"
          disabled={
            isSubmitting ||
            isDefaultWarehouse ||
            statusValue === "inactive"
          }
          aria-describedby="warehouse-default-hint"
          {...register("isDefault")}
        />
        <div className="space-y-1">
          <label htmlFor="warehouse-default" className="text-sm font-medium">
            Default warehouse
          </label>
          <p
            id="warehouse-default-hint"
            className="text-xs text-[var(--color-muted-foreground)]"
          >
            {isDefaultWarehouse
              ? "Promote another warehouse to default before changing this one."
              : "Only one warehouse can be default. Default warehouses must be active."}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
