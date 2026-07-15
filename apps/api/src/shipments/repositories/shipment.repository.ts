import type { Shipment } from "@commerceflow/types";

import type { CreateShipmentRecord } from "./shipment-create-record";
import type { ShipmentStatusTransitionInput } from "./shipment-create-record";

export interface ShipmentRepository {
  findById(storeId: string, id: string): Promise<Shipment | null>;
  findByOrderId(storeId: string, orderId: string): Promise<Shipment | null>;
  listByOrderId(storeId: string, orderId: string): Promise<readonly Shipment[]>;
  create(record: CreateShipmentRecord): Promise<Shipment>;
  transitionStatus(
    storeId: string,
    id: string,
    transition: ShipmentStatusTransitionInput,
  ): Promise<Shipment>;
}
