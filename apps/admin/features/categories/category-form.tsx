"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Category } from "@commerceflow/types";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CATEGORY_FORM_DEFAULTS,
  categoryFormSchema,
  slugifyCategoryName,
  type CategoryFormValues,
} from "@/features/categories/category-form-schema";
import { CategoryParentSelect } from "@/features/categories/category-parent-select";
import { mapApiValidationErrors } from "@/features/products/map-api-validation-errors";
import { AdminApiError } from "@/types/api";

export interface CategoryFormProps {
  readonly category?: Category | null;
  readonly parentOptions: readonly Category[];
  readonly mode: "create" | "edit";
  readonly isSubmitting?: boolean;
  readonly onSubmit: (values: CategoryFormValues) => Promise<void>;
  readonly onCancel: () => void;
  readonly submitLabel?: string;
}

function toDefaultValues(category?: Category | null): CategoryFormValues {
  if (!category) {
    return { ...CATEGORY_FORM_DEFAULTS };
  }
  return {
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    parentId: category.parentId ?? "",
  };
}

export function CategoryForm({
  category,
  parentOptions,
  mode,
  isSubmitting = false,
  onSubmit,
  onCancel,
  submitLabel,
}: CategoryFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const slugTouchedRef = useRef(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: toDefaultValues(category),
  });

  const {
    register,
    handleSubmit,
    control,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const nameValue = watch("name");

  useEffect(() => {
    form.reset(toDefaultValues(category));
    setFormError(null);
    slugTouchedRef.current = mode === "edit";
  }, [category, form, mode]);

  useEffect(() => {
    if (mode !== "create" || slugTouchedRef.current) {
      return;
    }
    setValue("slug", slugifyCategoryName(nameValue ?? ""), {
      shouldValidate: false,
    });
  }, [mode, nameValue, setValue]);

  async function submit(values: CategoryFormValues) {
    setFormError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      const mapped = mapApiValidationErrors(error);
      for (const [field, message] of Object.entries(mapped.fieldErrors)) {
        if (message) {
          setError(field as keyof CategoryFormValues, { message });
        }
      }
      if (
        error instanceof AdminApiError &&
        error.code === "CATALOGUE_SLUG_ALREADY_EXISTS"
      ) {
        setError("slug", { message: error.message });
      }
      if (
        error instanceof AdminApiError &&
        (error.code === "CATALOGUE_PARENT_CYCLE" ||
          error.code === "CATALOGUE_CATEGORY_NOT_FOUND")
      ) {
        setError("parentId", { message: error.message });
      }
      if (error instanceof AdminApiError && error.status === 403) {
        setFormError("You do not have permission to manage categories.");
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
        <ErrorState title="Unable to save category" message={formError} />
      ) : null}

      <div className="space-y-2">
        <label htmlFor="category-name" className="text-sm font-medium">
          Name
        </label>
        <Input
          id="category-name"
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
        <label htmlFor="category-slug" className="text-sm font-medium">
          Slug
        </label>
        <Input
          id="category-slug"
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
        <label htmlFor="category-parent" className="text-sm font-medium">
          Parent category{" "}
          <span className="font-normal text-[var(--color-muted-foreground)]">
            (optional)
          </span>
        </label>
        <Controller
          name="parentId"
          control={control}
          render={({ field }) => (
            <CategoryParentSelect
              value={field.value}
              categories={parentOptions}
              excludeCategoryId={mode === "edit" ? category?.id : null}
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.parentId)}
              onValueChange={field.onChange}
            />
          )}
        />
        {errors.parentId ? (
          <p className="text-sm text-[var(--color-destructive)]" role="alert">
            {errors.parentId.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="category-description" className="text-sm font-medium">
          Description{" "}
          <span className="font-normal text-[var(--color-muted-foreground)]">
            (optional)
          </span>
        </label>
        <Textarea
          id="category-description"
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
              (mode === "create" ? "Create category" : "Save changes"))}
        </Button>
      </div>
    </form>
  );
}
