import type { StorePermissionCode } from "./store-permission";
import type { StoreRole } from "./store-role";

/** Result of a successful store authorization check. */
export interface AuthorizedStoreContext {
  readonly userId: string;
  readonly sessionId: string;
  readonly storeId: string;
  readonly storeRole: StoreRole;
  readonly permission: StorePermissionCode;
}
