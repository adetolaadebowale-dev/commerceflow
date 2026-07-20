"use client";

import { useQuery } from "@tanstack/react-query";

import { storeSettingsQueryKey } from "@/features/settings/settings-query-keys";
import { getStoreSettings } from "@/services/settings.service";

export function useStoreSettings(storeId: string | null) {
  return useQuery({
    queryKey: storeSettingsQueryKey(storeId ?? ""),
    enabled: Boolean(storeId),
    queryFn: () => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return getStoreSettings(storeId);
    },
  });
}
