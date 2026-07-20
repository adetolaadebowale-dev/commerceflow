"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ProductVariant } from "@commerceflow/types";
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
  AttributeEditor,
  attributesToPairs,
  pairsToAttributes,
  type AttributePair,
} from "@/features/products/variants/attribute-editor";
import {
  generateVariantName,
  VARIANT_CURRENCY_OPTIONS,
  variantFormSchema,
  type VariantFormValues,
} from "@/features/products/variants/variant-form-schema";
import { AdminApiError } from "@/types/api";

export interface VariantFormProps {
  readonly variant?: ProductVariant | null;
  readonly isSubmitting?: boolean;
  readonly onSubmit: (values: VariantFormValues) => Promise<void>;
  readonly onCancel: () => void;
  readonly submitLabel?: string;
}

function toDefaultValues(variant?: ProductVariant | null): VariantFormValues {
  if (!variant) {
    return {
      sku: "",
      name: "",
      price: "",
      currency: "USD",
      attributes: {},
    };
  }
  return {
    sku: variant.sku,
    name: variant.name,
    price: variant.price,
    currency: variant.currency,
    attributes: { ...(variant.attributes ?? {}) },
  };
}

export function VariantForm({
  variant,
  isSubmitting = false,
  onSubmit,
  onCancel,
  submitLabel = "Save variant",
}: VariantFormProps) {
  const [pairs, setPairs] = useState<AttributePair[]>(() =>
    attributesToPairs(variant?.attributes),
  );
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<VariantFormValues>({
    resolver: zodResolver(variantFormSchema),
    defaultValues: toDefaultValues(variant),
  });

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = form;

  useEffect(() => {
    form.reset(toDefaultValues(variant));
    setPairs(attributesToPairs(variant?.attributes));
    setFormError(null);
  }, [variant, form]);

  useEffect(() => {
    const attributes = pairsToAttributes(pairs);
    setValue("attributes", attributes, { shouldValidate: false });
    setValue("name", generateVariantName(attributes), {
      shouldValidate: false,
      shouldDirty: true,
    });
  }, [pairs, setValue]);

  async function submit(values: VariantFormValues) {
    setFormError(null);
    const attributes = pairsToAttributes(pairs);
    const payload: VariantFormValues = {
      ...values,
      attributes,
      name: generateVariantName(attributes),
    };

    try {
      await onSubmit(payload);
    } catch (error) {
      const mapped = mapApiValidationErrors(error);
      for (const [field, message] of Object.entries(mapped.fieldErrors)) {
        if (message) {
          setError(field as keyof VariantFormValues, { message });
        }
      }
      if (
        error instanceof AdminApiError &&
        error.code === "CATALOGUE_SKU_ALREADY_EXISTS"
      ) {
        setError("sku", { message: error.message });
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
        <ErrorState title="Unable to save variant" message={formError} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="variant-sku" className="text-sm font-medium">
            SKU
          </label>
          <Input
            id="variant-sku"
            autoComplete="off"
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.sku)}
            {...register("sku")}
          />
          {errors.sku ? (
            <p className="text-sm text-[var(--color-destructive)]" role="alert">
              {errors.sku.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="variant-price" className="text-sm font-medium">
            Price
          </label>
          <Input
            id="variant-price"
            inputMode="decimal"
            disabled={isSubmitting}
            placeholder="29.99"
            aria-invalid={Boolean(errors.price)}
            {...register("price")}
          />
          {errors.price ? (
            <p className="text-sm text-[var(--color-destructive)]" role="alert">
              {errors.price.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="variant-currency" className="text-sm font-medium">
            Currency
          </label>
          <Controller
            control={control}
            name="currency"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isSubmitting}
              >
                <SelectTrigger id="variant-currency" aria-invalid={Boolean(errors.currency)}>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {VARIANT_CURRENCY_OPTIONS.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.currency ? (
            <p className="text-sm text-[var(--color-destructive)]" role="alert">
              {errors.currency.message}
            </p>
          ) : null}
        </div>
      </div>

      <AttributeEditor
        pairs={pairs}
        onChange={setPairs}
        disabled={isSubmitting}
        error={errors.attributes?.message as string | undefined}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
