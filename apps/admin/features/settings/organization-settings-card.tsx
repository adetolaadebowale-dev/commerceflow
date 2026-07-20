"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Organization } from "@commerceflow/types";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { mapApiValidationErrors } from "@/features/products/map-api-validation-errors";
import {
  organizationSettingsFormSchema,
  toOrganizationSettingsPayload,
  type OrganizationSettingsFormValues,
} from "@/features/settings/organization-settings-form-schema";
import { SettingsSection } from "@/features/settings/settings-section";
import { useUpdateOrganization } from "@/features/settings/use-update-organization";
import { formatDateTime } from "@/lib/format";
import { useToast } from "@/providers/toast-provider";
import { AdminApiError } from "@/types/api";

export interface OrganizationSettingsCardProps {
  readonly organizationId: string | null | undefined;
  readonly organization: Organization | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly errorMessage: string;
  readonly onRetry: () => void;
}

function toDefaultValues(
  organization: Organization | undefined,
): OrganizationSettingsFormValues {
  return {
    name: organization?.name ?? "",
    slug: organization?.slug ?? "",
  };
}

export function OrganizationSettingsCard({
  organizationId,
  organization,
  isLoading,
  isError,
  errorMessage,
  onRetry,
}: OrganizationSettingsCardProps) {
  const { toast } = useToast();
  const updateMutation = useUpdateOrganization(organizationId);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<OrganizationSettingsFormValues>({
    resolver: zodResolver(organizationSettingsFormSchema),
    defaultValues: toDefaultValues(organization),
  });

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = form;

  useEffect(() => {
    reset(toDefaultValues(organization));
    setFormError(null);
  }, [organization, reset]);

  async function onSubmit(values: OrganizationSettingsFormValues) {
    setFormError(null);
    try {
      await updateMutation.mutateAsync(toOrganizationSettingsPayload(values));
      toast("Organization settings saved");
    } catch (error) {
      const mapped = mapApiValidationErrors(error);
      for (const [field, message] of Object.entries(mapped.fieldErrors)) {
        if (message) {
          setError(field as keyof OrganizationSettingsFormValues, { message });
        }
      }
      if (error instanceof AdminApiError && error.status === 403) {
        setFormError(
          "You do not have permission to update organization settings.",
        );
      } else {
        setFormError(mapped.formMessage);
      }
      toast(
        error instanceof AdminApiError
          ? error.message
          : "Unable to save organization settings.",
        "error",
      );
    }
  }

  return (
    <SettingsSection
      id="organization-settings"
      title="Organization"
      description="Tenant profile for this store’s organization."
    >
      {!organizationId ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Organization details will appear after store settings load.
        </p>
      ) : isLoading ? (
        <div
          className="space-y-3"
          aria-busy="true"
          aria-label="Loading organization"
        >
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Unable to load organization"
          message={errorMessage}
          action={
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          }
        />
      ) : organization ? (
        <div className="space-y-6">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[var(--color-muted-foreground)]">
                Organization ID
              </dt>
              <dd className="mt-1 font-mono text-xs break-all">
                {organization.id}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-muted-foreground)]">Updated</dt>
              <dd className="mt-1">{formatDateTime(organization.updatedAt)}</dd>
            </div>
          </dl>

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
                <label htmlFor="org-name" className="text-sm font-medium">
                  Organization name
                </label>
                <Input
                  id="org-name"
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
                <label htmlFor="org-slug" className="text-sm font-medium">
                  Slug
                </label>
                <Input
                  id="org-slug"
                  disabled={updateMutation.isPending}
                  aria-invalid={Boolean(errors.slug)}
                  {...register("slug")}
                />
                {errors.slug ? (
                  <p
                    className="text-sm text-[var(--color-destructive)]"
                    role="alert"
                  >
                    {errors.slug.message}
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
                {updateMutation.isPending
                  ? "Saving…"
                  : "Save organization"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </SettingsSection>
  );
}
