"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { StoreConfiguration } from "@commerceflow/types";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { mapApiValidationErrors } from "@/features/products/map-api-validation-errors";
import {
  storeSettingsFormSchema,
  toStoreSettingsPayload,
  type StoreSettingsFormValues,
} from "@/features/settings/store-settings-form-schema";
import { SettingsSection } from "@/features/settings/settings-section";
import { useUpdateStoreSettings } from "@/features/settings/use-update-store-settings";
import { useToast } from "@/providers/toast-provider";
import { AdminApiError } from "@/types/api";

export interface StoreSettingsFormProps {
  readonly storeId: string;
  readonly store: StoreConfiguration | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly errorMessage: string;
  readonly onRetry: () => void;
}

function toDefaultValues(
  store: StoreConfiguration | undefined,
): StoreSettingsFormValues {
  return {
    name: store?.name ?? "",
    slug: store?.slug ?? "",
    defaultCurrency: store?.settings.defaultCurrency ?? "USD",
    defaultTimezone: store?.settings.defaultTimezone ?? "UTC",
    locale: store?.settings.locale ?? "en-US",
  };
}

export function StoreSettingsForm({
  storeId,
  store,
  isLoading,
  isError,
  errorMessage,
  onRetry,
}: StoreSettingsFormProps) {
  const { toast } = useToast();
  const updateMutation = useUpdateStoreSettings(storeId);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<StoreSettingsFormValues>({
    resolver: zodResolver(storeSettingsFormSchema),
    defaultValues: toDefaultValues(store),
  });

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = form;

  useEffect(() => {
    reset(toDefaultValues(store));
    setFormError(null);
  }, [store, reset]);

  async function onSubmit(values: StoreSettingsFormValues) {
    setFormError(null);
    try {
      await updateMutation.mutateAsync(toStoreSettingsPayload(values));
      toast("Store settings saved");
    } catch (error) {
      const mapped = mapApiValidationErrors(error);
      for (const [field, message] of Object.entries(mapped.fieldErrors)) {
        if (message) {
          setError(field as keyof StoreSettingsFormValues, { message });
        }
      }
      if (error instanceof AdminApiError && error.status === 403) {
        setFormError("You do not have permission to update store settings.");
      } else {
        setFormError(mapped.formMessage);
      }
      toast(
        error instanceof AdminApiError
          ? error.message
          : "Unable to save store settings.",
        "error",
      );
    }
  }

  return (
    <SettingsSection
      id="store-settings"
      title="Store settings"
      description="Catalogue defaults for this store. Only fields supported by the API are shown."
    >
      {isLoading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading store settings">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-64" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Unable to load store settings"
          message={errorMessage}
          action={
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          }
        />
      ) : (
        <form
          className="space-y-4"
          onSubmit={handleSubmit((values) => void onSubmit(values))}
          noValidate
        >
          {formError ? (
            <ErrorState title="Unable to save" message={formError} />
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="store-name" className="text-sm font-medium">
                Store name
              </label>
              <Input
                id="store-name"
                disabled={updateMutation.isPending}
                aria-invalid={Boolean(errors.name)}
                {...register("name")}
              />
              {errors.name ? (
                <p
                  className="text-sm text-[var(--color-destructive)]"
                  role="alert"
                >
                  {errors.name.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="store-slug" className="text-sm font-medium">
                Slug
              </label>
              <Input
                id="store-slug"
                disabled={updateMutation.isPending}
                aria-invalid={Boolean(errors.slug)}
                {...register("slug")}
              />
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Lowercase letters, numbers, and hyphens only.
              </p>
              {errors.slug ? (
                <p
                  className="text-sm text-[var(--color-destructive)]"
                  role="alert"
                >
                  {errors.slug.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="store-currency" className="text-sm font-medium">
                Currency
              </label>
              <Input
                id="store-currency"
                disabled={updateMutation.isPending}
                aria-invalid={Boolean(errors.defaultCurrency)}
                placeholder="USD"
                {...register("defaultCurrency")}
              />
              <p className="text-xs text-[var(--color-muted-foreground)]">
                3-letter ISO 4217 code (e.g. USD).
              </p>
              {errors.defaultCurrency ? (
                <p
                  className="text-sm text-[var(--color-destructive)]"
                  role="alert"
                >
                  {errors.defaultCurrency.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="store-timezone" className="text-sm font-medium">
                Timezone
              </label>
              <Input
                id="store-timezone"
                disabled={updateMutation.isPending}
                aria-invalid={Boolean(errors.defaultTimezone)}
                placeholder="UTC"
                {...register("defaultTimezone")}
              />
              {errors.defaultTimezone ? (
                <p
                  className="text-sm text-[var(--color-destructive)]"
                  role="alert"
                >
                  {errors.defaultTimezone.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="store-locale" className="text-sm font-medium">
                Locale
              </label>
              <Input
                id="store-locale"
                disabled={updateMutation.isPending}
                aria-invalid={Boolean(errors.locale)}
                placeholder="en-US"
                {...register("locale")}
              />
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Form ll or ll-RR (e.g. en or en-US).
              </p>
              {errors.locale ? (
                <p
                  className="text-sm text-[var(--color-destructive)]"
                  role="alert"
                >
                  {errors.locale.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={updateMutation.isPending || !isDirty}
              aria-busy={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving…" : "Save store settings"}
            </Button>
          </div>
        </form>
      )}
    </SettingsSection>
  );
}
