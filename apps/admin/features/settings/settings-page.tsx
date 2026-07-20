"use client";

import { ErrorState } from "@/components/ui/error-state";
import { AccountSummaryCard } from "@/features/settings/account-summary-card";
import { NotificationPreferencesForm } from "@/features/settings/notification-preferences-form";
import { OrganizationSettingsCard } from "@/features/settings/organization-settings-card";
import { StoreSettingsForm } from "@/features/settings/store-settings-form";
import { useNotificationPreferences } from "@/features/settings/use-notification-preferences";
import { useOrganization } from "@/features/settings/use-organization";
import { useStoreSettings } from "@/features/settings/use-store-settings";
import {
  storeNotConfiguredMessage,
  unableToLoadMessage,
} from "@/lib/ui-messages";
import { useAuth } from "@/providers/auth-provider";
import { AdminApiError } from "@/types/api";

export function SettingsPage() {
  const { user, storeId, storeName: fallbackStoreName } = useAuth();
  const storeQuery = useStoreSettings(storeId);
  const organizationId = storeQuery.data?.organizationId;
  const organizationQuery = useOrganization(organizationId);
  const preferencesQuery = useNotificationPreferences(storeId);

  if (!storeId) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Store, organization, and account configuration.
          </p>
        </header>
        <ErrorState
          title="Store not configured"
          message={storeNotConfiguredMessage("settings")}
        />
      </div>
    );
  }

  const storeName = storeQuery.data?.name ?? fallbackStoreName;

  const storeErrorMessage =
    storeQuery.error instanceof AdminApiError
      ? storeQuery.error.message
      : unableToLoadMessage("store settings");

  const organizationErrorMessage =
    organizationQuery.error instanceof AdminApiError
      ? organizationQuery.error.message
      : unableToLoadMessage("organization");

  const preferencesErrorMessage =
    preferencesQuery.error instanceof AdminApiError
      ? preferencesQuery.error.message
      : unableToLoadMessage("notification preferences");

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Store, organization, and account configuration.
        </p>
      </header>

      <AccountSummaryCard
        session={user}
        storeId={storeId}
        storeName={storeName}
      />

      <StoreSettingsForm
        storeId={storeId}
        store={storeQuery.data}
        isLoading={storeQuery.isLoading}
        isError={storeQuery.isError}
        errorMessage={storeErrorMessage}
        onRetry={() => void storeQuery.refetch()}
      />

      <OrganizationSettingsCard
        organizationId={organizationId}
        organization={organizationQuery.data}
        isLoading={Boolean(organizationId) && organizationQuery.isLoading}
        isError={organizationQuery.isError}
        errorMessage={organizationErrorMessage}
        onRetry={() => void organizationQuery.refetch()}
      />

      <NotificationPreferencesForm
        storeId={storeId}
        preferences={preferencesQuery.data}
        isLoading={preferencesQuery.isLoading}
        isError={preferencesQuery.isError}
        errorMessage={preferencesErrorMessage}
        onRetry={() => void preferencesQuery.refetch()}
      />
    </div>
  );
}
