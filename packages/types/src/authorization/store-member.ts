import type { StoreRole } from "./store-role";

/** Links an authenticated user to a store with a store-scoped role. */
export interface StoreMember {
  readonly id: string;
  readonly storeId: string;
  readonly userId: string;
  readonly role: StoreRole;
  readonly createdAt: string;
  readonly updatedAt: string;
}
