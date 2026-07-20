"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Product } from "@commerceflow/types";
import { useEffect, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  editProductFormSchema,
  type EditProductFormValues,
} from "@/features/products/edit-product-form-schema";
import { mapApiValidationErrors } from "@/features/products/map-api-validation-errors";
import { useUpdateProduct } from "@/features/products/use-update-product";
import { useToast } from "@/providers/toast-provider";
import { AdminApiError } from "@/types/api";

export interface ProductEditFormProps {
  readonly product: Product;
  readonly storeId: string;
  readonly brands: readonly { readonly id: string; readonly name: string }[];
  readonly categories: readonly { readonly id: string; readonly name: string }[];
  readonly onDirtyChange?: (isDirty: boolean) => void;
}

function toFormValues(product: Product): EditProductFormValues {
  return {
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    status: product.status === "active" ? "active" : "draft",
    categoryId: product.categoryId,
    brandId: product.brandId ?? "",
  };
}

export function ProductEditForm({
  product,
  storeId,
  brands,
  categories,
  onDirtyChange,
}: ProductEditFormProps) {
  const { toast } = useToast();
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const updateMutation = useUpdateProduct(storeId, product.id);

  const form = useForm<EditProductFormValues>({
    resolver: zodResolver(editProductFormSchema),
    defaultValues: toFormValues(product),
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = form;

  useEffect(() => {
    reset(toFormValues(product));
  }, [product, reset]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!isDirty) {
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  async function onSubmit(values: EditProductFormValues): Promise<void> {
    if (updateMutation.isPending) {
      return;
    }

    try {
      const updated = await updateMutation.mutateAsync({
        name: values.name,
        slug: values.slug,
        description: values.description?.trim()
          ? values.description.trim()
          : undefined,
        status: values.status,
        categoryId: values.categoryId,
        brandId: values.brandId ? values.brandId : undefined,
      });
      reset(toFormValues(updated));
      toast("Product saved successfully");
      saveButtonRef.current?.focus();
    } catch (error) {
      const mapped = mapApiValidationErrors(error);
      for (const [field, message] of Object.entries(mapped.fieldErrors)) {
        if (
          field === "name" ||
          field === "slug" ||
          field === "description" ||
          field === "status" ||
          field === "categoryId" ||
          field === "brandId"
        ) {
          setError(field, { message });
        }
      }
      toast(
        error instanceof AdminApiError
          ? error.message
          : mapped.formMessage || "Unable to save product.",
        "error",
      );
      setError("root", {
        message: mapped.formMessage || "Unable to save product.",
      });
    }
  }

  const busy = isSubmitting || updateMutation.isPending;

  return (
    <form
      className="space-y-5"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Edit product information"
    >
      {errors.root?.message ? (
        <ErrorState message={errors.root.message} />
      ) : null}

      <div className="space-y-2">
        <label htmlFor="edit-name" className="text-sm font-medium">
          Product Name
        </label>
        <Input
          id="edit-name"
          disabled={busy}
          aria-invalid={errors.name ? "true" : "false"}
          {...register("name")}
        />
        {errors.name ? (
          <p className="text-xs text-[var(--color-destructive)]">
            {errors.name.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="edit-description" className="text-sm font-medium">
          Description
        </label>
        <Textarea
          id="edit-description"
          disabled={busy}
          aria-invalid={errors.description ? "true" : "false"}
          {...register("description")}
        />
        {errors.description ? (
          <p className="text-xs text-[var(--color-destructive)]">
            {errors.description.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="edit-brandId" className="text-sm font-medium">
            Brand
          </label>
          <Controller
            control={control}
            name="brandId"
            render={({ field }) => (
              <Select
                value={field.value || "none"}
                onValueChange={(value) =>
                  field.onChange(value === "none" ? "" : value)
                }
                disabled={busy}
              >
                <SelectTrigger id="edit-brandId" aria-label="Brand">
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No brand</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.brandId ? (
            <p className="text-xs text-[var(--color-destructive)]">
              {errors.brandId.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="edit-categoryId" className="text-sm font-medium">
            Category
          </label>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select
                value={field.value || "none"}
                onValueChange={(value) =>
                  field.onChange(value === "none" ? "" : value)
                }
                disabled={busy}
              >
                <SelectTrigger
                  id="edit-categoryId"
                  aria-label="Category"
                  aria-invalid={errors.categoryId ? "true" : "false"}
                >
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>
                    Select category
                  </SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.categoryId ? (
            <p className="text-xs text-[var(--color-destructive)]">
              {errors.categoryId.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="edit-status" className="text-sm font-medium">
            Status
          </label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={busy}
              >
                <SelectTrigger id="edit-status" aria-label="Status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.status ? (
            <p className="text-xs text-[var(--color-destructive)]">
              {errors.status.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="edit-slug" className="text-sm font-medium">
            Slug
          </label>
          <Input
            id="edit-slug"
            disabled={busy}
            aria-invalid={errors.slug ? "true" : "false"}
            {...register("slug")}
          />
          {errors.slug ? (
            <p className="text-xs text-[var(--color-destructive)]">
              {errors.slug.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          ref={saveButtonRef}
          type="submit"
          disabled={busy || !isDirty}
          aria-disabled={busy || !isDirty}
        >
          {busy ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
