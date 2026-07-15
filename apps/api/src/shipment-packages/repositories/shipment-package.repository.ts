import type { ShipmentPackage } from "@commerceflow/types";
import type { UpdateShipmentPackageInput } from "@commerceflow/validation";

import type { CreateShipmentPackageRecord } from "./shipment-package-create-record";

export interface ShipmentPackageRepository {
  findById(storeId: string, id: string): Promise<ShipmentPackage | null>;
  listByShipmentId(
    storeId: string,
    shipmentId: string,
  ): Promise<readonly ShipmentPackage[]>;
  create(record: CreateShipmentPackageRecord): Promise<ShipmentPackage>;
  update(
    storeId: string,
    id: string,
    input: UpdateShipmentPackageInput,
  ): Promise<ShipmentPackage>;
  delete(storeId: string, id: string): Promise<ShipmentPackage>;
}
