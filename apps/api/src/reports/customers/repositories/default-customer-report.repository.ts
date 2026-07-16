import type { Order, Payment } from "@commerceflow/types";

import { getCustomerAddressRepository, getCustomerRepository } from "@/customers/repositories";
import { getOrderRepository } from "@/orders/repositories";
import { getPaymentRepository } from "@/payments/repositories";
import { getRefundRepository } from "@/refunds/repositories";
import { sumCurrencyAmounts } from "../../services/report-utils";
import {
  calculateUnitsPurchased,
  derivePaymentStatus,
} from "../mappers/customer-order-fact.mapper";
import { mapCustomerToProfileFact } from "../mappers/customer-fact.mapper";
import type {
  CustomerOrderFact,
  CustomerReportRepository,
  ListCustomerOrderFactsQuery,
  ListCustomerProfileFactsQuery,
} from "./customer-report.repository";

const REPORTING_PAGE_SIZE = 100;

export class DefaultCustomerReportRepository implements CustomerReportRepository {
  constructor(
    private readonly customerRepository = getCustomerRepository(),
    private readonly customerAddressRepository = getCustomerAddressRepository(),
    private readonly orderRepository = getOrderRepository(),
    private readonly paymentRepository = getPaymentRepository(),
    private readonly refundRepository = getRefundRepository(),
  ) {}

  async listCustomerProfileFacts(query: ListCustomerProfileFactsQuery) {
    const customers = await this.loadAllCustomers(query);
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
    const orders = await this.loadAllOrders(query);
    const facts: CustomerOrderFact[] = [];

    for (const order of orders) {
      if (query.currency && order.currency !== query.currency) {
        continue;
      }

      if (
        query.customerIds &&
        query.customerIds.length > 0 &&
        (!order.customerProfileId ||
          !query.customerIds.includes(order.customerProfileId))
      ) {
        continue;
      }

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

  private async loadAllCustomers(query: ListCustomerProfileFactsQuery) {
    const customers = [];
    let page = 1;
    let total = Number.POSITIVE_INFINITY;

    while (customers.length < total) {
      const result = await this.customerRepository.list({
        storeId: query.storeId,
        status: query.customerStatus,
        page,
        limit: REPORTING_PAGE_SIZE,
      });

      let items = result.items;

      if (query.customerIds && query.customerIds.length > 0) {
        const allowed = new Set(query.customerIds);
        items = items.filter((customer) => allowed.has(customer.id));
      }

      customers.push(...items);
      total = result.total;

      if (result.items.length === 0) {
        break;
      }

      page += 1;
    }

    return customers;
  }

  private async loadAllOrders(query: ListCustomerOrderFactsQuery) {
    const orders: Order[] = [];
    let page = 1;
    let total = Number.POSITIVE_INFINITY;

    while (orders.length < total) {
      const result = await this.orderRepository.list({
        storeId: query.storeId,
        status: query.orderStatus,
        page,
        limit: REPORTING_PAGE_SIZE,
      });

      orders.push(...result.items);
      total = result.total;

      if (result.items.length === 0) {
        break;
      }

      page += 1;
    }

    return orders;
  }

  private async sumCompletedRefunds(
    storeId: string,
    payments: readonly Payment[],
  ): Promise<string> {
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

const customerReportRepository = new DefaultCustomerReportRepository();

export function getCustomerReportRepository(): CustomerReportRepository {
  return customerReportRepository;
}
