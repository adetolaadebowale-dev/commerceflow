/** Supported dimension units for shipment packages. */
export const DIMENSION_UNITS = ["cm", "in", "m"] as const;

export type DimensionUnit = (typeof DIMENSION_UNITS)[number];
