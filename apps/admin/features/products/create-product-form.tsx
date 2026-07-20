"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  buildDefaultVariant,
  createProductFormSchema,
  slugifyProductName,
  type CreateProductFormValues,
} from "@/features/products/create-product-form-schema";
import { mapApiValidationErrors } from "@/features/products/map-api-validation-errors";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import {
  createProduct,
  listBrands,
  listCategories,
} from "@/services/products.service";

export function CreateProductForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { storeId } = useAuth();
  const slugManuallyEdited = useRef(false);
  const allowNavigation = useRef(false);

  const form = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      status: "draft",
      categoryId: "",
      brandId: "",
    },
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isDirty, isSubmitting, isSubmitSuccessful },
  } = form;

  const nameValue = watch("name");

  const brandsQuery = useQuery({
    queryKey: ["brands", "product-filters", storeId],
    enabled: Boolean(storeId),
    queryFn: () => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return listBrands({ storeId, page: 1, limit: 100 });
    },
    staleTime: 60_000,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories", "product-filters", storeId],
    enabled: Boolean(storeId),
    queryFn: () => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return listCategories({ storeId, page: 1, limit: 100 });
    },
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: createProduct,
    onSuccess: async (product) => {
      allowNavigation.current = true;
      if (storeId) {
        await queryClient.invalidateQueries({ queryKey: ["products", storeId] });
      } else {
        await queryClient.invalidateQueries({ queryKey: ["products"] });
      }
      toast(
        "Product created successfully. Continue by uploading images or editing product details.",
      );
      router.push(`/dashboard/products/${product.id}`);
    },
  });

  useEffect(() => {
    if (slugManuallyEdited.current) {
      return;
    }
    setValue("slug", slugifyProductName(nameValue), {
      shouldValidate: false,
      shouldDirty: false,
    });
  }, [nameValue, setValue]);

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!isDirty || isSubmitSuccessful || allowNavigation.current) {
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, isSubmitSuccessful]);

  if (!storeId) {
    return (
      <ErrorState
        title="Store not configured"
        message="Set NEXT_PUBLIC_DEFAULT_STORE_ID to a valid store UUID to create products."
      />
    );
  }

  const filtersLoading = brandsQuery.isLoading || categoriesQuery.isLoading;
  const filtersError = brandsQuery.isError || categoriesQuery.isError;

  async function onSubmit(values: CreateProductFormValues): Promise<void> {
    if (!storeId || mutation.isPending) {
      return;
    }

    try {
      await mutation.mutateAsync({
        storeId,
        name: values.name,
        slug: values.slug,
        description: values.description?.trim()
          ? values.description.trim()
          : undefined,
        status: values.status,
        categoryId: values.categoryId,
        brandId: values.brandId ? values.brandId : undefined,
        variants: [buildDefaultVariant(values.slug)],
      });
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
      setError("root", { message: mapped.formMessage });
    }
  }

  function handleCancel() {
    if (isDirty && !allowNavigation.current) {
      const confirmed = window.confirm(
        "You have unsaved changes. Leave without saving?",
      );
      if (!confirmed) {
        return;
      }
    }
    allowNavigation.current = true;
    router.push("/dashboard/products");
  }

  const busy = isSubmitting || mutation.isPending;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add Product</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Create a catalogue product. Variants and pricing can be refined later.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Product details</CardTitle>
          <CardDescription>
            Required fields are validated against the shared CommerceFlow schema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filtersLoading ? (
            <div className="flex min-h-[12rem] items-center justify-center">
              <LoadingSpinner label="Loading brands and categories..." />
            </div>
          ) : filtersError ? (
            <ErrorState
              title="Unable to load form options"
              message="Brand and category lists could not be loaded. Retry from the product list."
            />
          ) : (
            <form
              className="space-y-5"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              {errors.root?.message ? (
                <ErrorState message={errors.root.message} />
              ) : null}

              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Product Name
                </label>
                <Input
                  id="name"
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
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
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
                  <label htmlFor="brandId" className="text-sm font-medium">
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
                        <SelectTrigger id="brandId" aria-label="Brand">
                          <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No brand</SelectItem>
                          {(brandsQuery.data?.items ?? []).map((brand) => (
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
                  <label htmlFor="categoryId" className="text-sm font-medium">
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
                          id="categoryId"
                          aria-label="Category"
                          aria-invalid={errors.categoryId ? "true" : "false"}
                        >
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" disabled>
                            Select category
                          </SelectItem>
                          {(categoriesQuery.data?.items ?? []).map((category) => (
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
                  <label htmlFor="status" className="text-sm font-medium">
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
                        <SelectTrigger id="status" aria-label="Status">
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
                  <label htmlFor="slug" className="text-sm font-medium">
                    Slug
                  </label>
                  <Input
                    id="slug"
                    disabled={busy}
                    aria-invalid={errors.slug ? "true" : "false"}
                    {...register("slug", {
                      onChange: () => {
                        slugManuallyEdited.current = true;
                      },
                    })}
                  />
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Required by the API. Suggested from the product name; edit as
                    needed.
                  </p>
                  {errors.slug ? (
                    <p className="text-xs text-[var(--color-destructive)]">
                      {errors.slug.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy ? "Creating..." : "Create Product"}
                </Button>
                <Button asChild variant="ghost" className="sm:mr-auto">
                  <Link href="/dashboard/products">Back to list</Link>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
