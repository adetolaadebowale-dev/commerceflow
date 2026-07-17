import type { OrganizationPermissionCode } from "./organization-permission";
import type { StoreRole } from "./store-role";

/** Result of a successful organization authorization check. */
export interface AuthorizedOrganizationContext {
  readonly userId: string;
  readonly sessionId: string;
  readonly organizationId: string;
  readonly organizationRole: StoreRole;
  readonly permission: OrganizationPermissionCode;
}
