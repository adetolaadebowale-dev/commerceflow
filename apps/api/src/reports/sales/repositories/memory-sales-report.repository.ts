import { MemoryOrderRepository } from "@/orders/repositories/memory-order.repository";
import { MemoryPaymentRepository } from "@/payments/repositories/memory-payment.repository";
import { MemoryShipmentRepository } from "@/shipments/repositories/memory-shipment.repository";
import { mapOrderToSalesOrderFact } from "../mappers/sales-order-fact.mapper";
import type {
  ListSalesOrderFactsQuery,
  SalesReportRepository,
} from "./sales-report.repository";

export class MemorySalesReportRepository implements SalesReportRepository {
  constructor(
    private readonly orderRepository: MemoryOrderRepository,
    private readonly paymentRepository: MemoryPaymentRepository,
    private readonly shipmentRepository: MemoryShipmentRepository,
  ) {}

  async listOrderFacts(query: ListSalesOrderFactsQuery) {
    let orders = [...(await this.loadOrders(query.storeId))];

    if (query.orderStatus) {
      orders = orders.filter((order) => order.status === query.orderStatus);
    }

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

  private async loadOrders(storeId: string) {
    const result = await this.orderRepository.list({
      storeId,
      page: 1,
      limit: 10_000,
    });

    return result.items;
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
}
