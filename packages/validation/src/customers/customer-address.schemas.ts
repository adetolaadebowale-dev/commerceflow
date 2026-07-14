import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

const labelSchema = z
  .string()
  .trim()
  .min(1, "Label is required")
  .max(50, "Label must be at most 50 characters");

const recipientNameSchema = z
  .string()
  .trim()
  .min(1, "Recipient name is required")
  .max(200, "Recipient name must be at most 200 characters");

const phoneSchema = z
  .string()
  .trim()
  .min(1, "Phone must not be empty when provided")
  .max(30, "Phone must be at most 30 characters")
  .optional();

const addressLineSchema = z
  .string()
  .trim()
  .min(1, "Address line is required")
  .max(200, "Address line must be at most 200 characters");

const optionalAddressLineSchema = z
  .string()
  .trim()
  .min(1, "Address line must not be empty when provided")
  .max(200, "Address line must be at most 200 characters")
  .optional();

const citySchema = z
  .string()
  .trim()
  .min(1, "City is required")
  .max(100, "City must be at most 100 characters");

const stateProvinceSchema = z
  .string()
  .trim()
  .min(1, "State or province is required")
  .max(100, "State or province must be at most 100 characters");

const postalCodeSchema = z
  .string()
  .trim()
  .min(1, "Postal code is required")
  .max(20, "Postal code must be at most 20 characters");

const countryCodeSchema = z
  .string()
  .trim()
  .length(2, "Country code must be a 2-letter ISO 3166-1 alpha-2 code")
  .regex(/^[A-Za-z]{2}$/, "Country code must contain letters only")
  .transform((value) => value.toUpperCase());

export const createCustomerAddressSchema = z.object({
  label: labelSchema,
  recipientName: recipientNameSchema,
  phone: phoneSchema,
  addressLine1: addressLineSchema,
  addressLine2: optionalAddressLineSchema,
  city: citySchema,
  stateProvince: stateProvinceSchema,
  postalCode: postalCodeSchema,
  countryCode: countryCodeSchema,
  isDefault: z.boolean().default(false),
});

export const updateCustomerAddressSchema = createCustomerAddressSchema.partial();

export const customerAddressIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export type CreateCustomerAddressInput = z.infer<
  typeof createCustomerAddressSchema
>;
export type UpdateCustomerAddressInput = z.infer<
  typeof updateCustomerAddressSchema
>;
