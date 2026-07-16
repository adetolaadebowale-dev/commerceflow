import type { Invoice, Payment, Refund } from "@commerceflow/types";

import { MemoryInvoiceRepository } from "@/invoices/repositories/memory-invoice.repository";
import { MemoryOrderRepository } from "@/orders/repositories/memory-order.repository";
import { MemoryPaymentRepository } from "@/payments/repositories/memory-payment.repository";
import { MemoryRefundRepository } from "@/refunds/repositories/memory-refund.repository";
import { MemoryShipmentRepository } from "@/shipments/repositories/memory-shipment.repository";
import { sumCurrencyAmounts } from "../../services/report-utils";
import {
  mapInvoiceToFact,
  mapOrderToFinancialOrderFact,
  mapPaymentToFact,
  mapRefundToFact,
} from "../mappers/financial-fact.mapper";
import type {
  FinancialReportRepository,
  ListFinancialOrderFactsQuery,
  ListInvoiceFactsQuery,
  ListPaymentFactsQuery,
  ListRefundFactsQuery,
} from "./financial-report.repository";

export class MemoryFinancialReportRepository implements FinancialReportRepository {
  constructor(
    private readonly orderRepository: MemoryOrderRepository,
    private readonly paymentRepository: MemoryPaymentRepository,
    private readonly invoiceRepository: MemoryInvoiceRepository,
    private readonly refundRepository: MemoryRefundRepository,
    private readonly shipmentRepository: MemoryShipmentRepository,
  ) {}

  async listOrderFacts(query: ListFinancialOrderFactsQuery) {
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

    const warehouseByOrderId = await this.loadWarehouseByOrderId(query.storeId);
    const facts = [];

    for (const order of orders) {
      const payments = await this.paymentRepository.listByOrderId(
        query.storeId,
        order.id,
      );
      const refundTotal = await this.sumCompletedRefunds(query.storeId, payments);

      facts.push(
        mapOrderToFinancialOrderFact(
          order,
          payments,
          refundTotal,
          warehouseByOrderId.get(order.id),
        ),
      );
    }

    return facts;
  }

  async listInvoiceFacts(query: ListInvoiceFactsQuery) {
    const result = await this.orderRepository.list({
      storeId: query.storeId,
      page: 1,
      limit: 10_000,
    });
    const facts = [];

    for (const order of result.items) {
      const invoices = await this.invoiceRepository.listByOrderId(
        query.storeId,
        order.id,
      );

      for (const invoice of invoices) {
        if (query.currency && invoice.currency !== query.currency) {
          continue;
        }

        if (query.invoiceStatus && invoice.status !== query.invoiceStatus) {
          continue;
        }

        facts.push(mapInvoiceToFact(invoice, order.orderNumber));
      }
    }

    return facts;
  }

  async listPaymentFacts(query: ListPaymentFactsQuery) {
    const result = await this.orderRepository.list({
      storeId: query.storeId,
      page: 1,
      limit: 10_000,
    });
    const facts = [];

    for (const order of result.items) {
      const payments = await this.paymentRepository.listByOrderId(
        query.storeId,
        order.id,
      );

      for (const payment of payments) {
        if (query.currency && payment.currency !== query.currency) {
          continue;
        }

        if (query.paymentStatus && payment.status !== query.paymentStatus) {
          continue;
        }

        facts.push(mapPaymentToFact(payment, order.orderNumber));
      }
    }

    return facts;
  }

  async listRefundFacts(query: ListRefundFactsQuery) {
    const result = await this.orderRepository.list({
      storeId: query.storeId,
      page: 1,
      limit: 10_000,
    });
    const facts = [];

    for (const order of result.items) {
      const payments = await this.paymentRepository.listByOrderId(
        query.storeId,
        order.id,
      );

      for (const payment of payments) {
        const refunds = await this.refundRepository.listByPaymentId(
          query.storeId,
          payment.id,
        );

        for (const refund of refunds) {
          if (query.currency && refund.currency !== query.currency) {
            continue;
          }

          facts.push(mapRefundToFact(refund, order.id, order.orderNumber));
        }
      }
    }

    return facts;
  }

  seedInvoice(invoice: Invoice): void {
    this.invoiceRepository.seedInvoice(invoice);
  }

  seedPayment(payment: Payment): void {
    this.paymentRepository.seedPayment(payment);
  }

  seedRefund(refund: Refund): void {
    this.refundRepository.seedRefund(refund);
  }

  private async loadWarehouseByOrderId(storeId: string) {
    const shipments = await this.shipmentRepository.listByStoreId(storeId);
    const warehouseByOrderId = new Map<string, string | undefined>();

    for (const shipment of shipments) {
      if (!warehouseByOrderId.has(shipment.orderId)) {
        warehouseByOrderId.set(shipment.orderId, shipment.warehouseId);
      }
    }

    return warehouseByOrderId;
  }

  private async sumCompletedRefunds(
    storeId: string,
    payments: readonly Payment[],
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
