"use client";

import { useQuery } from "@tanstack/react-query";

import { notificationPreferencesQueryKey } from "@/features/settings/settings-query-keys";
import { listNotificationPreferences } from "@/services/settings.service";

export function useNotificationPreferences(storeId: string | null) {
  return useQuery({
    queryKey: notificationPreferencesQueryKey(storeId ?? ""),
    enabled: Boolean(storeId),
    queryFn: () => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return listNotificationPreferences(storeId);
    },
  });
}
