import type { DimensionUnit } from "./dimension-unit";
import type { WeightUnit } from "./weight-unit";

/** Physical package belonging to a shipment with warehouse dimensions. */
export interface ShipmentPackage {
  readonly id: string;
  readonly shipmentId: string;
  readonly storeId: string;
  readonly packageNumber: string;
  readonly weight: string;
  readonly weightUnit: WeightUnit;
  readonly length: string;
  readonly width: string;
  readonly height: string;
  readonly dimensionUnit: DimensionUnit;
  readonly trackingNumber?: string;
  readonly metadata?: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
}
