import { PAYMENT_TERMS, SUPPLIER_STATUSES } from "@commerceflow/types";
import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

const supplierCodeSchema = z
  .string()
  .trim()
  .min(1, "Code is required")
  .max(50, "Code must be at most 50 characters")
  .regex(/^[A-Z0-9_-]+$/, "Code must be uppercase alphanumeric with _ or -");

const supplierNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(200, "Name must be at most 200 characters");

const currencySchema = z
  .string()
  .trim()
  .length(3, "Currency must be a 3-letter ISO code")
  .transform((value) => value.toUpperCase());

const optionalEmailSchema = z
  .string()
  .trim()
  .email("Email must be valid")
  .max(320)
  .optional();

const optionalPhoneSchema = z.string().trim().max(50).optional();
const optionalWebsiteSchema = z.string().trim().url("Website must be a valid URL").max(500).optional();
const optionalTaxIdSchema = z.string().trim().max(100).optional();
const optionalNotesSchema = z.string().trim().max(2000).optional();

export const createSupplierSchema = z.object({
  storeId: storeIdSchema,
  code: supplierCodeSchema,
  name: supplierNameSchema,
  email: optionalEmailSchema,
  phone: optionalPhoneSchema,
  website: optionalWebsiteSchema,
  taxId: optionalTaxIdSchema,
  paymentTerm: z.enum(PAYMENT_TERMS).default("net30"),
  currency: currencySchema.default("USD"),
  status: z.enum(SUPPLIER_STATUSES).default("active"),
  notes: optionalNotesSchema,
});

export const updateSupplierSchema = z
  .object({
    code: supplierCodeSchema.optional(),
    name: supplierNameSchema.optional(),
    email: optionalEmailSchema,
    phone: optionalPhoneSchema,
    website: optionalWebsiteSchema,
    taxId: optionalTaxIdSchema,
    paymentTerm: z.enum(PAYMENT_TERMS).optional(),
    currency: currencySchema.optional(),
    status: z.enum(SUPPLIER_STATUSES).optional(),
    notes: optionalNotesSchema,
  })
  .refine(
    (data) =>
      data.code !== undefined ||
      data.name !== undefined ||
      data.email !== undefined ||
      data.phone !== undefined ||
      data.website !== undefined ||
      data.taxId !== undefined ||
      data.paymentTerm !== undefined ||
      data.currency !== undefined ||
      data.status !== undefined ||
      data.notes !== undefined,
    { message: "At least one field must be provided" },
  );

export const supplierIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export const listSuppliersQuerySchema = z.object({
  storeId: storeIdSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(SUPPLIER_STATUSES).optional(),
  search: z.string().trim().max(200).optional(),
});

export const createSupplierContactSchema = z.object({
  storeId: storeIdSchema,
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: optionalEmailSchema,
  phone: optionalPhoneSchema,
  role: z.string().trim().max(100).optional(),
  isPrimary: z.boolean().default(false),
});

export const updateSupplierContactSchema = z
  .object({
    storeId: storeIdSchema,
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),
    email: optionalEmailSchema,
    phone: optionalPhoneSchema,
    role: z.string().trim().max(100).optional(),
    isPrimary: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.firstName !== undefined ||
      data.lastName !== undefined ||
      data.email !== undefined ||
      data.phone !== undefined ||
      data.role !== undefined ||
      data.isPrimary !== undefined,
    { message: "At least one field must be provided" },
  );

export const supplierContactIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type SupplierIdQuery = z.infer<typeof supplierIdQuerySchema>;
export type ListSuppliersQuery = z.infer<typeof listSuppliersQuerySchema>;
export type CreateSupplierContactInput = z.infer<typeof createSupplierContactSchema>;
export type UpdateSupplierContactInput = z.infer<typeof updateSupplierContactSchema>;
export type SupplierContactIdQuery = z.infer<typeof supplierContactIdQuerySchema>;
