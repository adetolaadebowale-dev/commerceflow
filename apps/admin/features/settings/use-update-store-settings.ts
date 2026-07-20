"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateStoreSettingsRequest } from "@commerceflow/api-client";

import { storeSettingsQueryKey } from "@/features/settings/settings-query-keys";
import { updateStoreSettings } from "@/services/settings.service";

export function useUpdateStoreSettings(storeId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateStoreSettingsRequest) => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return updateStoreSettings(storeId, input);
    },
    onSuccess: (store) => {
      if (!storeId) {
        return;
      }
      queryClient.setQueryData(storeSettingsQueryKey(storeId), store);
    },
  });
}
