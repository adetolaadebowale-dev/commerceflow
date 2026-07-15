import {
  SHIPMENT_CARRIERS,
  SHIPPING_METHOD_STATUSES,
  SHIPPING_ZONE_STATUSES,
} from "@commerceflow/types";
import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(200, "Name must be at most 200 characters");

const descriptionSchema = z
  .string()
  .trim()
  .max(2000, "Description must be at most 2000 characters")
  .optional();

const countryCodeSchema = z
  .string()
  .trim()
  .length(2, "Country code must be a 2-letter ISO 3166-1 alpha-2 code")
  .regex(/^[A-Za-z]{2}$/, "Country code must contain letters only")
  .transform((value) => value.toUpperCase());

const countriesSchema = z
  .array(countryCodeSchema)
  .min(1, "At least one country is required")
  .superRefine((countries, ctx) => {
    const unique = new Set(countries);

    if (unique.size !== countries.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Country codes must be unique within the zone",
        path: [],
      });
    }
  });

const flatRateSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Flat rate must be a valid decimal amount")
  .superRefine((value, ctx) => {
    const numericValue = Number.parseFloat(value);

    if (numericValue < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Flat rate must be greater than or equal to 0",
        path: [],
      });
    }
  });

const currencySchema = z
  .string()
  .trim()
  .length(3, "Currency must be a 3-letter ISO code")
  .transform((value) => value.toUpperCase());

export const createShippingZoneSchema = z.object({
  storeId: storeIdSchema,
  name: nameSchema,
  countries: countriesSchema,
  status: z.enum(SHIPPING_ZONE_STATUSES).default("inactive"),
});

export const updateShippingZoneSchema = z
  .object({
    name: nameSchema.optional(),
    countries: countriesSchema.optional(),
    status: z.enum(SHIPPING_ZONE_STATUSES).optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.countries !== undefined ||
      data.status !== undefined,
    { message: "At least one field must be provided" },
  );

export const listShippingZonesQuerySchema = z.object({
  storeId: storeIdSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(SHIPPING_ZONE_STATUSES).optional(),
  search: z.string().trim().max(200).optional(),
});

export const shippingZoneIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export const createShippingMethodSchema = z.object({
  storeId: storeIdSchema,
  shippingZoneId: z.string().uuid("Shipping zone id must be a valid UUID"),
  name: nameSchema,
  description: descriptionSchema,
  carrier: z.enum(SHIPMENT_CARRIERS),
  flatRate: flatRateSchema,
  currency: currencySchema,
  status: z.enum(SHIPPING_METHOD_STATUSES).default("inactive"),
});

export const updateShippingMethodSchema = z
  .object({
    shippingZoneId: z.string().uuid("Shipping zone id must be a valid UUID").optional(),
    name: nameSchema.optional(),
    description: descriptionSchema,
    carrier: z.enum(SHIPMENT_CARRIERS).optional(),
    flatRate: flatRateSchema.optional(),
    currency: currencySchema.optional(),
    status: z.enum(SHIPPING_METHOD_STATUSES).optional(),
  })
  .refine(
    (data) =>
      data.shippingZoneId !== undefined ||
      data.name !== undefined ||
      data.description !== undefined ||
      data.carrier !== undefined ||
      data.flatRate !== undefined ||
      data.currency !== undefined ||
      data.status !== undefined,
    { message: "At least one field must be provided" },
  );

export const listShippingMethodsQuerySchema = z.object({
  storeId: storeIdSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(SHIPPING_METHOD_STATUSES).optional(),
  shippingZoneId: z.string().uuid("Shipping zone id must be a valid UUID").optional(),
  search: z.string().trim().max(200).optional(),
});

export const shippingMethodIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export type CreateShippingZoneInput = z.infer<typeof createShippingZoneSchema>;
export type UpdateShippingZoneInput = z.infer<typeof updateShippingZoneSchema>;
export type ListShippingZonesQuery = z.infer<typeof listShippingZonesQuerySchema>;
export type CreateShippingMethodInput = z.infer<typeof createShippingMethodSchema>;
export type UpdateShippingMethodInput = z.infer<typeof updateShippingMethodSchema>;
export type ListShippingMethodsQuery = z.infer<typeof listShippingMethodsQuerySchema>;
