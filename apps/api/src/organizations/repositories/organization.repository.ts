import type {
  Organization,
  OrganizationStoreSummary,
} from "@commerceflow/types";
import type { UpdateOrganizationInput } from "@commerceflow/validation";

export interface OrganizationRepository {
  findById(id: string): Promise<Organization | null>;
  findBySlug(slug: string): Promise<Organization | null>;
  update(id: string, input: UpdateOrganizationInput): Promise<Organization>;
  listStores(organizationId: string): Promise<readonly OrganizationStoreSummary[]>;
}
