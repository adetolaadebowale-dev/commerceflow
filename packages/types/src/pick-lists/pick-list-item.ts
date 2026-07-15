/** Line item on a pick list with required and picked quantities. */
export interface PickListItem {
  readonly id: string;
  readonly pickListId: string;
  readonly orderItemId: string;
  readonly quantityRequired: number;
  readonly quantityPicked: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}
