import type { ShipmentTrackingEvent } from "@commerceflow/types";

import type { CreateShipmentTrackingEventRecord } from "./shipment-tracking-create-record";

export interface ShipmentTrackingRepository {
  append(record: CreateShipmentTrackingEventRecord): Promise<ShipmentTrackingEvent>;
  listByShipmentId(
    storeId: string,
    shipmentId: string,
  ): Promise<readonly ShipmentTrackingEvent[]>;
}
