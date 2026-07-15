import {
  DIMENSION_UNITS,
  WEIGHT_UNITS,
} from "@commerceflow/types";
import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");
const metadataSchema = z.record(z.string(), z.unknown()).optional();

const positiveDecimalSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d+)?$/, "Value must be a valid positive decimal")
  .superRefine((value, ctx) => {
    const numericValue = Number.parseFloat(value);

    if (numericValue <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Value must be greater than 0",
        path: [],
      });
    }
  });

export const createShipmentPackageSchema = z.object({
  weight: positiveDecimalSchema,
  weightUnit: z.enum(WEIGHT_UNITS, {
    message: "Weight unit must be kg, lb, g, or oz",
  }),
  length: positiveDecimalSchema,
  width: positiveDecimalSchema,
  height: positiveDecimalSchema,
  dimensionUnit: z.enum(DIMENSION_UNITS, {
    message: "Dimension unit must be cm, in, or m",
  }),
  trackingNumber: z.string().trim().min(1).optional(),
  metadata: metadataSchema,
});

export const updateShipmentPackageSchema = z
  .object({
    weight: positiveDecimalSchema.optional(),
    weightUnit: z.enum(WEIGHT_UNITS).optional(),
    length: positiveDecimalSchema.optional(),
    width: positiveDecimalSchema.optional(),
    height: positiveDecimalSchema.optional(),
    dimensionUnit: z.enum(DIMENSION_UNITS).optional(),
    trackingNumber: z.string().trim().min(1).nullable().optional(),
    metadata: metadataSchema,
  })
  .refine(
    (value) =>
      value.weight !== undefined ||
      value.weightUnit !== undefined ||
      value.length !== undefined ||
      value.width !== undefined ||
      value.height !== undefined ||
      value.dimensionUnit !== undefined ||
      value.trackingNumber !== undefined ||
      value.metadata !== undefined,
    { message: "At least one field must be provided" },
  );

export const shipmentPackageIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export const shipmentPackageQuerySchema = z.object({
  storeId: storeIdSchema,
});

export type CreateShipmentPackageInput = z.infer<
  typeof createShipmentPackageSchema
>;
export type UpdateShipmentPackageInput = z.infer<
  typeof updateShipmentPackageSchema
>;
export type ShipmentPackageIdQuery = z.infer<
  typeof shipmentPackageIdQuerySchema
>;
export type ShipmentPackageQuery = z.infer<typeof shipmentPackageQuerySchema>;
