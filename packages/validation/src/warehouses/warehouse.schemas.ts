import { WAREHOUSE_STATUSES } from "@commerceflow/types";
import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

const warehouseNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(200, "Name must be at most 200 characters");

const warehouseCodeSchema = z
  .string()
  .trim()
  .min(1, "Code is required")
  .max(50, "Code must be at most 50 characters")
  .regex(/^[A-Z0-9_-]+$/, "Code must be uppercase alphanumeric with _ or -");

const countryCodeSchema = z
  .string()
  .trim()
  .length(2, "Country code must be 2 characters")
  .transform((value) => value.toUpperCase());

const addressFields = {
  address: z.string().trim().min(1).max(500),
  city: z.string().trim().min(1).max(200),
  stateProvince: z.string().trim().min(1).max(200),
  postalCode: z.string().trim().min(1).max(20),
  countryCode: countryCodeSchema,
};

export const createWarehouseSchema = z.object({
  storeId: storeIdSchema,
  name: warehouseNameSchema,
  code: warehouseCodeSchema,
  ...addressFields,
  status: z.enum(WAREHOUSE_STATUSES).default("active"),
  isDefault: z.boolean().default(false),
});

export const updateWarehouseSchema = z
  .object({
    name: warehouseNameSchema.optional(),
    code: warehouseCodeSchema.optional(),
    address: addressFields.address.optional(),
    city: addressFields.city.optional(),
    stateProvince: addressFields.stateProvince.optional(),
    postalCode: addressFields.postalCode.optional(),
    countryCode: countryCodeSchema.optional(),
    status: z.enum(WAREHOUSE_STATUSES).optional(),
    isDefault: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.code !== undefined ||
      data.address !== undefined ||
      data.city !== undefined ||
      data.stateProvince !== undefined ||
      data.postalCode !== undefined ||
      data.countryCode !== undefined ||
      data.status !== undefined ||
      data.isDefault !== undefined,
    { message: "At least one field must be provided" },
  );

export const warehouseIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export const listWarehousesQuerySchema = z.object({
  storeId: storeIdSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(WAREHOUSE_STATUSES).optional(),
  search: z.string().trim().max(200).optional(),
});

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;
export type WarehouseIdQuery = z.infer<typeof warehouseIdQuerySchema>;
export type ListWarehousesQuery = z.infer<typeof listWarehousesQuerySchema>;
