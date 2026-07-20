"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateOrganizationRequest } from "@commerceflow/api-client";

import {
  organizationQueryKey,
  organizationStoresQueryKey,
} from "@/features/settings/settings-query-keys";
import { updateOrganization } from "@/services/settings.service";

export function useUpdateOrganization(
  organizationId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateOrganizationRequest) => {
      if (!organizationId) {
        throw new Error("Organization id is required");
      }
      return updateOrganization(organizationId, input);
    },
    onSuccess: (organization) => {
      if (!organizationId) {
        return;
      }
      queryClient.setQueryData(organizationQueryKey(organizationId), organization);
      void queryClient.invalidateQueries({
        queryKey: organizationStoresQueryKey(organizationId),
      });
    },
  });
}
