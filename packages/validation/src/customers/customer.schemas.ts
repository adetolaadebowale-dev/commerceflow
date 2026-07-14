import { z } from "zod";

import { CUSTOMER_STATUSES } from "@commerceflow/types";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Email must be a valid email address")
  .max(320, "Email must be at most 320 characters");

const firstNameSchema = z
  .string()
  .trim()
  .min(1, "First name is required")
  .max(100, "First name must be at most 100 characters");

const lastNameSchema = z
  .string()
  .trim()
  .min(1, "Last name is required")
  .max(100, "Last name must be at most 100 characters");

const phoneSchema = z
  .string()
  .trim()
  .min(1, "Phone must not be empty when provided")
  .max(30, "Phone must be at most 30 characters")
  .optional();

export const createCustomerSchema = z.object({
  storeId: storeIdSchema,
  email: emailSchema,
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  phone: phoneSchema,
  status: z.enum(CUSTOMER_STATUSES).default("active"),
});

export const updateCustomerSchema = createCustomerSchema
  .omit({ storeId: true })
  .partial();

export const listCustomersQuerySchema = z.object({
  storeId: storeIdSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).optional(),
  status: z.enum(CUSTOMER_STATUSES).optional(),
});

export const customerIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
