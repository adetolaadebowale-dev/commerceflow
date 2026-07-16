import type { Customer } from "@commerceflow/types";

import type { CustomerProfileFact } from "../repositories/customer-report.repository";

export function mapCustomerToProfileFact(
  customer: Customer,
  options: {
    readonly defaultCountryCode?: string;
    readonly defaultCity?: string;
  } = {},
): CustomerProfileFact {
  return {
    customerId: customer.id,
    storeId: customer.storeId,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    status: customer.status,
    customerSince: customer.createdAt,
    defaultCountryCode: options.defaultCountryCode,
    defaultCity: options.defaultCity,
  };
}
