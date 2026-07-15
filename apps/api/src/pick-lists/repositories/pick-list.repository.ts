import type { PickList } from "@commerceflow/types";
import type { UpdatePickListInput } from "@commerceflow/validation";

import type {
  CreatePickListRecord,
  PickListStatusTransitionInput,
} from "./pick-list-create-record";

export interface PickListRepository {
  findById(storeId: string, id: string): Promise<PickList | null>;
  findActiveByShipmentId(
    storeId: string,
    shipmentId: string,
  ): Promise<PickList | null>;
  listByShipmentId(
    storeId: string,
    shipmentId: string,
  ): Promise<readonly PickList[]>;
  create(record: CreatePickListRecord): Promise<PickList>;
  updateItems(
    storeId: string,
    id: string,
    input: UpdatePickListInput,
  ): Promise<PickList>;
  transitionStatus(
    storeId: string,
    id: string,
    transition: PickListStatusTransitionInput,
  ): Promise<PickList>;
}
