"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Brand } from "@commerceflow/types";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  BRAND_FORM_DEFAULTS,
  brandFormSchema,
  slugifyBrandName,
  type BrandFormValues,
} from "@/features/brands/brand-form-schema";
import { mapApiValidationErrors } from "@/features/products/map-api-validation-errors";
import { AdminApiError } from "@/types/api";

export interface BrandFormProps {
  readonly brand?: Brand | null;
  readonly mode: "create" | "edit";
  readonly isSubmitting?: boolean;
  readonly onSubmit: (values: BrandFormValues) => Promise<void>;
  readonly onCancel: () => void;
  readonly submitLabel?: string;
}

function toDefaultValues(brand?: Brand | null): BrandFormValues {
  if (!brand) {
    return { ...BRAND_FORM_DEFAULTS };
  }
  return {
    name: brand.name,
    slug: brand.slug,
    description: brand.description ?? "",
  };
}

export function BrandForm({
  brand,
  mode,
  isSubmitting = false,
  onSubmit,
  onCancel,
  submitLabel,
}: BrandFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const slugTouchedRef = useRef(false);

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: toDefaultValues(brand),
  });

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const nameValue = watch("name");

  useEffect(() => {
    form.reset(toDefaultValues(brand));
    setFormError(null);
    slugTouchedRef.current = mode === "edit";
  }, [brand, form, mode]);

  useEffect(() => {
    if (mode !== "create" || slugTouchedRef.current) {
      return;
    }
    setValue("slug", slugifyBrandName(nameValue ?? ""), {
      shouldValidate: false,
    });
  }, [mode, nameValue, setValue]);

  async function submit(values: BrandFormValues) {
    setFormError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      const mapped = mapApiValidationErrors(error);
      for (const [field, message] of Object.entries(mapped.fieldErrors)) {
        if (message) {
          setError(field as keyof BrandFormValues, { message });
        }
      }
      if (
        error instanceof AdminApiError &&
        (error.code === "BRAND_SLUG_ALREADY_EXISTS" ||
          error.code === "BRAND_ALREADY_EXISTS")
      ) {
        setError("slug", { message: error.message });
      }
      if (error instanceof AdminApiError && error.status === 403) {
        setFormError("You do not have permission to manage brands.");
      } else {
        setFormError(mapped.formMessage);
      }
      throw error;
    }
  }

  const slugRegister = register("slug");

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit(async (values) => {
        try {
          await submit(values);
        } catch {
          // Mapped onto fields / formError.
        }
      })}
      noValidate
    >
      {formError ? (
        <ErrorState title="Unable to save brand" message={formError} />
      ) : null}

      <div className="space-y-2">
        <label htmlFor="brand-name" className="text-sm font-medium">
          Name
        </label>
        <Input
          id="brand-name"
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
        <label htmlFor="brand-slug" className="text-sm font-medium">
          Slug
        </label>
        <Input
          id="brand-slug"
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.slug)}
          {...slugRegister}
          onChange={(event) => {
            slugTouchedRef.current = true;
            void slugRegister.onChange(event);
          }}
        />
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Lowercase letters, numbers, and hyphens only.
        </p>
        {errors.slug ? (
          <p className="text-sm text-[var(--color-destructive)]" role="alert">
            {errors.slug.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="brand-description" className="text-sm font-medium">
          Description{" "}
          <span className="font-normal text-[var(--color-muted-foreground)]">
            (optional)
          </span>
        </label>
        <Textarea
          id="brand-description"
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.description)}
          {...register("description")}
        />
        {errors.description ? (
          <p className="text-sm text-[var(--color-destructive)]" role="alert">
            {errors.description.message}
          </p>
        ) : null}
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
          {isSubmitting
            ? "Saving…"
            : (submitLabel ??
              (mode === "create" ? "Create brand" : "Save changes"))}
        </Button>
      </div>
    </form>
  );
}
