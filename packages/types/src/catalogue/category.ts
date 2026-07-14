/**
 * Product category within the catalog hierarchy.
 */
export interface Category {
  readonly id: string;
  readonly storeId: string;
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly parentId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
