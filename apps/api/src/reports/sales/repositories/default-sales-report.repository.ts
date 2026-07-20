import type { Order } from "@commerceflow/types";

import { getOrderRepository } from "@/orders/repositories";
import { getPaymentRepository } from "@/payments/repositories";
import { getShipmentRepository } from "@/shipments/repositories";
import { mapOrderToSalesOrderFact } from "../mappers/sales-order-fact.mapper";
import { PrismaSalesReportRepository } from "./prisma-sales-report.repository";
import type {
  ListSalesOrderFactsQuery,
  SalesOrderFact,
  SalesReportRepository,
} from "./sales-report.repository";

const REPORTING_PAGE_SIZE = 100;

export class DefaultSalesReportRepository implements SalesReportRepository {
  constructor(
    private readonly orderRepository = getOrderRepository(),
    private readonly paymentRepository = getPaymentRepository(),
    private readonly shipmentRepository = getShipmentRepository(),
  ) {}

  async listOrderFacts(
    query: ListSalesOrderFactsQuery,
  ): Promise<readonly SalesOrderFact[]> {
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

      facts.push(
        mapOrderToSalesOrderFact(
          order,
          payments,
          warehouseByOrderId.get(order.id),
        ),
      );
    }

    return facts;
  }

  private async loadAllOrders(
    query: ListSalesOrderFactsQuery,
  ): Promise<readonly Order[]> {
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

  private async loadWarehouseByOrderId(
    storeId: string,
  ): Promise<Map<string, string | undefined>> {
    const shipments = await this.shipmentRepository.listByStoreId(storeId);
    const warehouseByOrderId = new Map<string, string | undefined>();

    for (const shipment of shipments) {
      if (!warehouseByOrderId.has(shipment.orderId)) {
        warehouseByOrderId.set(shipment.orderId, shipment.warehouseId);
      }
    }

    return warehouseByOrderId;
  }
}

const salesReportRepository = new PrismaSalesReportRepository();

export function getSalesReportRepository(): SalesReportRepository {
  return salesReportRepository;
}
