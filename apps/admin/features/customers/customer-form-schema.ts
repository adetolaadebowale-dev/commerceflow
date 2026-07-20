import { CUSTOMER_STATUSES } from "@commerceflow/types";
import { createCustomerSchema } from "@commerceflow/validation";
import { z } from "zod";

/**
 * Create/edit form schema derived from shared createCustomerSchema (no storeId).
 * Empty phone is allowed in the UI and stripped before API calls.
 */
export const customerCreateFormSchema = createCustomerSchema
  .omit({ storeId: true })
  .extend({
    phone: z.string().trim().max(30, "Phone must be at most 30 characters"),
    status: z.enum(CUSTOMER_STATUSES),
  });

export const customerEditFormSchema = customerCreateFormSchema;

export type CustomerFormValues = z.infer<typeof customerCreateFormSchema>;

export const CUSTOMER_FORM_DEFAULTS: CustomerFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  status: "active",
};

export function toCreatePayload(values: CustomerFormValues) {
  const phone = values.phone.trim();
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email,
    phone: phone.length > 0 ? phone : undefined,
    status: values.status,
  };
}
