import type { CreateShipmentPackageInput } from "@commerceflow/validation";

export interface CreateShipmentPackageRecord
  extends CreateShipmentPackageInput {
  readonly storeId: string;
  readonly shipmentId: string;
  readonly packageNumber?: string;
}
