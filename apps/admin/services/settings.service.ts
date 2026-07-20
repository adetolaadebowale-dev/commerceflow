import type {
  UpdateNotificationPreferenceRequest,
  UpdateOrganizationRequest,
  UpdateStoreSettingsRequest,
} from "@commerceflow/api-client";
import type {
  NotificationPreference,
  NotificationPreferenceType,
  NotificationPreferenceView,
  Organization,
  OrganizationStoreSummary,
  StoreConfiguration,
} from "@commerceflow/types";

import {
  notificationPreferenceClient,
  organizationClient,
  storeAdministrationClient,
  toAdminApiError,
} from "@/services/settings-client";

export async function getStoreSettings(
  storeId: string,
): Promise<StoreConfiguration> {
  try {
    const result = await storeAdministrationClient.getStoreSettings(storeId);
    return result.store;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function updateStoreSettings(
  storeId: string,
  input: UpdateStoreSettingsRequest,
): Promise<StoreConfiguration> {
  try {
    const result = await storeAdministrationClient.updateStoreSettings(
      storeId,
      input,
    );
    return result.store;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function getOrganization(
  organizationId: string,
): Promise<Organization> {
  try {
    const result = await organizationClient.getOrganization(organizationId);
    return result.organization;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function updateOrganization(
  organizationId: string,
  input: UpdateOrganizationRequest,
): Promise<Organization> {
  try {
    const result = await organizationClient.updateOrganization(
      organizationId,
      input,
    );
    return result.organization;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function listOrganizationStores(
  organizationId: string,
): Promise<readonly OrganizationStoreSummary[]> {
  try {
    const result =
      await organizationClient.listOrganizationStores(organizationId);
    return result.stores;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function listNotificationPreferences(
  storeId: string,
): Promise<readonly NotificationPreferenceView[]> {
  try {
    const result =
      await notificationPreferenceClient.listNotificationPreferences({
        storeId,
      });
    return result.preferences;
  } catch (error) {
    throw toAdminApiError(error);
  }
}

export async function updateNotificationPreference(
  type: NotificationPreferenceType,
  input: UpdateNotificationPreferenceRequest,
): Promise<NotificationPreference> {
  try {
    const result =
      await notificationPreferenceClient.updateNotificationPreference(
        type,
        input,
      );
    return result.preference;
  } catch (error) {
    throw toAdminApiError(error);
  }
}
