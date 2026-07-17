import type { CachePolicy } from "@commerceflow/types";
import type { UpdateCachePolicyInput } from "@commerceflow/validation";

export const DEFAULT_CACHE_POLICIES: readonly Omit<
  CachePolicy,
  "updatedAt"
>[] = [
  {
    resource: "catalogue.products",
    enabled: true,
    ttlSeconds: 60,
    description: "Product catalogue list and detail reads",
  },
  {
    resource: "catalogue.categories",
    enabled: true,
    ttlSeconds: 300,
    description: "Category tree and listings",
  },
  {
    resource: "reports.dashboard",
    enabled: false,
    ttlSeconds: 30,
    description: "Executive dashboard snapshots",
  },
];

export interface CachePolicyRepository {
  listPolicies(): Promise<readonly CachePolicy[]>;
  upsertPolicy(
    input: Omit<UpdateCachePolicyInput, "storeId">,
  ): Promise<CachePolicy>;
}
