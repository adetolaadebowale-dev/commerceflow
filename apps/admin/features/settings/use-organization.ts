"use client";

import { useQuery } from "@tanstack/react-query";

import { organizationQueryKey } from "@/features/settings/settings-query-keys";
import { getOrganization } from "@/services/settings.service";

export function useOrganization(organizationId: string | null | undefined) {
  return useQuery({
    queryKey: organizationQueryKey(organizationId ?? ""),
    enabled: Boolean(organizationId),
    queryFn: () => {
      if (!organizationId) {
        throw new Error("Organization id is required");
      }
      return getOrganization(organizationId);
    },
  });
}
