/** Supported weight units for shipment packages. */
export const WEIGHT_UNITS = ["kg", "lb", "g", "oz"] as const;

export type WeightUnit = (typeof WEIGHT_UNITS)[number];
