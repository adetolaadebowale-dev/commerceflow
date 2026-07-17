import type { StoreMember } from "@commerceflow/types";

export interface StoreMemberRepository {
  findActiveMembership(
    storeId: string,
    userId: string,
  ): Promise<StoreMember | null>;

  findActiveMembershipsForOrganization(
    organizationId: string,
    userId: string,
  ): Promise<readonly StoreMember[]>;
}
