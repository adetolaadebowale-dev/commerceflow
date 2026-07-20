"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { NotificationPreferenceType } from "@commerceflow/types";

import { notificationPreferencesQueryKey } from "@/features/settings/settings-query-keys";
import { updateNotificationPreference } from "@/services/settings.service";

export interface UpdateNotificationPreferenceInput {
  readonly type: NotificationPreferenceType;
  readonly emailEnabled: boolean;
  readonly smsEnabled: boolean;
  readonly inAppEnabled: boolean;
}

export function useUpdateNotificationPreference(storeId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateNotificationPreferenceInput) => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return updateNotificationPreference(input.type, {
        storeId,
        emailEnabled: input.emailEnabled,
        smsEnabled: input.smsEnabled,
        inAppEnabled: input.inAppEnabled,
      });
    },
    onSuccess: () => {
      if (!storeId) {
        return;
      }
      void queryClient.invalidateQueries({
        queryKey: notificationPreferencesQueryKey(storeId),
      });
    },
  });
}
