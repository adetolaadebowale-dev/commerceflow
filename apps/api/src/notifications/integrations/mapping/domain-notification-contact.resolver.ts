import type {
  OrderCustomerContact,
  Supplier,
  SupplierContactInfo,
} from "@commerceflow/types";

import { getCustomerRepository } from "@/customers/repositories";
import { getOrderRepository } from "@/orders/repositories";
import { getSupplierRepository } from "@/suppliers/repositories";

export interface DomainNotificationContactResolver {
  resolveOrderCustomer(
    storeId: string,
    orderId: string,
  ): Promise<OrderCustomerContact | null>;
  resolveSupplierContact(
    storeId: string,
    supplierId: string,
  ): Promise<SupplierContactInfo | null>;
}

function toSupplierContactInfo(supplier: Supplier): SupplierContactInfo {
  const primaryContact =
    supplier.contacts.find((contact) => contact.isPrimary) ??
    supplier.contacts[0];

  return {
    supplierId: supplier.id,
    email: primaryContact?.email ?? supplier.email,
    phone: primaryContact?.phone ?? supplier.phone,
    name: primaryContact
      ? `${primaryContact.firstName} ${primaryContact.lastName}`.trim()
      : supplier.name,
  };
}

export class DefaultDomainNotificationContactResolver
  implements DomainNotificationContactResolver
{
  constructor(
    private readonly orderRepository = getOrderRepository(),
    private readonly customerRepository = getCustomerRepository(),
    private readonly supplierRepository = getSupplierRepository(),
  ) {}

  async resolveOrderCustomer(
    storeId: string,
    orderId: string,
  ): Promise<OrderCustomerContact | null> {
    const order = await this.orderRepository.findById(storeId, orderId);

    if (!order) {
      return null;
    }

    const userId = order.customerId;

    if (order.customerProfileId) {
      const customer = await this.customerRepository.findById(
        storeId,
        order.customerProfileId,
      );

      if (customer) {
        return {
          userId,
          customerId: customer.id,
          email: customer.email,
          phone: customer.phone ?? order.shippingAddress?.phone,
          name: `${customer.firstName} ${customer.lastName}`.trim(),
        };
      }
    }

    if (order.shippingAddress?.phone) {
      return {
        userId,
        name: order.shippingAddress.recipientName,
        phone: order.shippingAddress.phone,
      };
    }

    if (userId) {
      return { userId };
    }

    return null;
  }

  async resolveSupplierContact(
    storeId: string,
    supplierId: string,
  ): Promise<SupplierContactInfo | null> {
    const supplier = await this.supplierRepository.findById(storeId, supplierId);

    if (!supplier) {
      return null;
    }

    return toSupplierContactInfo(supplier);
  }
}

export const domainNotificationContactResolver =
  new DefaultDomainNotificationContactResolver();
