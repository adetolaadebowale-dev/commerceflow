import type { CreatePickListInput } from "@commerceflow/validation";

export interface CreatePickListItemRecord {
  readonly orderItemId: string;
  readonly quantityRequired: number;
}

export interface CreatePickListRecord extends CreatePickListInput {
  readonly storeId: string;
  readonly shipmentId: string;
  readonly items: readonly CreatePickListItemRecord[];
}

export interface PickListStatusTransitionInput {
  readonly status: "picking" | "picked" | "packed";
  readonly startedAt?: Date;
  readonly completedAt?: Date;
}

export interface UpdatePickListItemQuantityInput {
  readonly orderItemId: string;
  readonly quantityPicked: number;
}
