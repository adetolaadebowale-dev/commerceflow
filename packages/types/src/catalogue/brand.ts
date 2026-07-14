/**
 * Product brand used for catalog merchandising.
 */
export interface Brand {
  readonly id: string;
  readonly storeId: string;
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
