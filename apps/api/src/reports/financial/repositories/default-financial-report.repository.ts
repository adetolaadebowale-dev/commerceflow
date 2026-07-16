import type { Order, Payment } from "@commerceflow/types";

import { getInvoiceRepository } from "@/invoices/repositories";
import { getOrderRepository } from "@/orders/repositories";
import { getPaymentRepository } from "@/payments/repositories";
import { getRefundRepository } from "@/refunds/repositories";
import { getShipmentRepository } from "@/shipments/repositories";
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

const REPORTING_PAGE_SIZE = 100;

export class DefaultFinancialReportRepository implements FinancialReportRepository {
  constructor(
    private readonly orderRepository = getOrderRepository(),
    private readonly paymentRepository = getPaymentRepository(),
    private readonly invoiceRepository = getInvoiceRepository(),
    private readonly refundRepository = getRefundRepository(),
    private readonly shipmentRepository = getShipmentRepository(),
  ) {}

  async listOrderFacts(query: ListFinancialOrderFactsQuery) {
    const orders = await this.loadAllOrders(query);
    const warehouseByOrderId = await this.loadWarehouseByOrderId(query.storeId);
    const facts = [];

    for (const order of orders) {
      if (query.currency && order.currency !== query.currency) {
        continue;
      }

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
    const orders = await this.loadAllOrders({ storeId: query.storeId });
    const facts = [];

    for (const order of orders) {
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
    const orders = await this.loadAllOrders({ storeId: query.storeId });
    const facts = [];

    for (const order of orders) {
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
    const orders = await this.loadAllOrders({ storeId: query.storeId });
    const facts = [];

    for (const order of orders) {
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

  private async loadAllOrders(query: ListFinancialOrderFactsQuery) {
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

const financialReportRepository = new DefaultFinancialReportRepository();

export function getFinancialReportRepository(): FinancialReportRepository {
  return financialReportRepository;
}
