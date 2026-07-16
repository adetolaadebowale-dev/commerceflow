import type { Customer, CustomerAddress } from "@commerceflow/types";

import { MemoryCustomerAddressRepository } from "@/customers/repositories/memory-customer-address.repository";
import { MemoryCustomerRepository } from "@/customers/repositories/memory-customer.repository";
import { MemoryOrderRepository } from "@/orders/repositories/memory-order.repository";
import { MemoryPaymentRepository } from "@/payments/repositories/memory-payment.repository";
import { MemoryRefundRepository } from "@/refunds/repositories/memory-refund.repository";
import { sumCurrencyAmounts } from "../../services/report-utils";
import { mapCustomerToProfileFact } from "../mappers/customer-fact.mapper";
import {
  calculateUnitsPurchased,
  derivePaymentStatus,
} from "../mappers/customer-order-fact.mapper";
import type {
  CustomerReportRepository,
  ListCustomerOrderFactsQuery,
  ListCustomerProfileFactsQuery,
} from "./customer-report.repository";

export class MemoryCustomerReportRepository implements CustomerReportRepository {
  constructor(
    private readonly customerRepository: MemoryCustomerRepository,
    private readonly customerAddressRepository: MemoryCustomerAddressRepository,
    private readonly orderRepository: MemoryOrderRepository,
    private readonly paymentRepository: MemoryPaymentRepository,
    private readonly refundRepository: MemoryRefundRepository,
  ) {}

  async listCustomerProfileFacts(query: ListCustomerProfileFactsQuery) {
    const result = await this.customerRepository.list({
      storeId: query.storeId,
      status: query.customerStatus,
      page: 1,
      limit: 10_000,
    });

    let customers = result.items;

    if (query.customerIds && query.customerIds.length > 0) {
      const allowed = new Set(query.customerIds);
      customers = customers.filter((customer) => allowed.has(customer.id));
    }

    const facts = [];

    for (const customer of customers) {
      const addresses = await this.customerAddressRepository.listByCustomerId(
        query.storeId,
        customer.id,
      );
      const defaultAddress =
        addresses.find((address) => address.isDefault) ?? addresses[0];

      facts.push(
        mapCustomerToProfileFact(customer, {
          defaultCountryCode: defaultAddress?.countryCode,
          defaultCity: defaultAddress?.city,
        }),
      );
    }

    return facts;
  }

  async listCustomerOrderFacts(query: ListCustomerOrderFactsQuery) {
    const result = await this.orderRepository.list({
      storeId: query.storeId,
      status: query.orderStatus,
      page: 1,
      limit: 10_000,
    });

    let orders = result.items;

    if (query.currency) {
      orders = orders.filter((order) => order.currency === query.currency);
    }

    if (query.customerIds && query.customerIds.length > 0) {
      const allowed = new Set(query.customerIds);
      orders = orders.filter(
        (order) =>
          order.customerProfileId !== undefined &&
          allowed.has(order.customerProfileId),
      );
    }

    const facts = [];

    for (const order of orders) {
      const payments = await this.paymentRepository.listByOrderId(
        query.storeId,
        order.id,
      );
      const refundTotal = await this.sumCompletedRefunds(query.storeId, payments);

      facts.push({
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerProfileId: order.customerProfileId,
        storeId: order.storeId,
        orderStatus: order.status,
        paymentStatus: derivePaymentStatus(payments),
        currency: order.currency,
        subtotal: order.subtotal,
        discountAmount: order.discountAmount ?? "0.00",
        taxAmount: order.taxAmount ?? "0.00",
        shippingAmount: order.shippingAmount ?? "0.00",
        total: order.total,
        refundTotal,
        unitsPurchased: calculateUnitsPurchased(order),
        reportTimestamp: order.confirmedAt ?? order.createdAt,
        createdAt: order.createdAt,
        confirmedAt: order.confirmedAt,
      });
    }

    return facts;
  }

  seedCustomer(customer: Customer): void {
    this.customerRepository.seedCustomer(customer);
  }

  seedCustomerAddress(address: CustomerAddress): void {
    this.customerAddressRepository.seedCustomerAddress(address);
  }

  private async sumCompletedRefunds(
    storeId: string,
    payments: readonly { readonly id: string }[],
  ) {
    const refundAmounts: string[] = [];

    for (const payment of payments) {
      const refunds = await this.refundRepository.listByPaymentId(
        storeId,
        payment.id,
      );

      for (const refund of refunds) {
        if (refund.status === "completed") {
          refundAmounts.push(refund.amount);
        }
      }
    }

    if (refundAmounts.length === 0) {
      return "0.00";
    }

    return sumCurrencyAmounts(refundAmounts);
  }
}
