import type { MemoryCustomerAddressRepository } from "@/customers/repositories/memory-customer-address.repository";
import type { MemoryCustomerRepository } from "@/customers/repositories/memory-customer.repository";
import type { MemoryInventoryItemRepository } from "@/inventory/repositories/memory-inventory-item.repository";
import type { MemoryOrderRepository } from "@/orders/repositories/memory-order.repository";
import type { MemoryPaymentRepository } from "@/payments/repositories/memory-payment.repository";
import type { MemoryPurchaseOrderRepository } from "@/purchase-orders/repositories/memory-purchase-order.repository";
import type { MemoryReplenishmentRepository } from "@/replenishment/repositories/memory-replenishment.repository";
import type { MemoryInventoryReservationRepository } from "@/reservations/repositories/memory-inventory-reservation.repository";
import type { MemoryRefundRepository } from "@/refunds/repositories/memory-refund.repository";
import type { MemoryShipmentRepository } from "@/shipments/repositories/memory-shipment.repository";
import { seedCustomerScenario } from "../../customers/testing/customer-scenario-utils";
import { seedInventoryReportingScenario } from "../../inventory/testing/inventory-scenario-utils";
import type { MemoryProcurementReportRepository } from "../../procurement/repositories/memory-procurement-report.repository";
import { seedProcurementScenario } from "../../procurement/testing/procurement-scenario-utils";
import { seedSalesScenario } from "../../sales/testing/sales-scenario-utils";
import {
  TEST_STORE_A_ID,
  TEST_WAREHOUSE_A_ID,
} from "./dashboard-test-utils";

export interface SeedDashboardScenarioInput {
  readonly storeId?: string;
  readonly subtotal?: string;
  readonly total?: string;
  readonly paymentStatus?: "paid" | "pending";
  readonly inventoryQuantity?: number;
  readonly reorderPoint?: number;
  readonly purchaseOrderQuantity?: number;
}

export async function seedDashboardScenario(
  module: {
    orderRepository: MemoryOrderRepository;
    paymentRepository: MemoryPaymentRepository;
    shipmentRepository: MemoryShipmentRepository;
    refundRepository: MemoryRefundRepository;
    customerRepository: MemoryCustomerRepository;
    customerAddressRepository: MemoryCustomerAddressRepository;
    inventoryItemRepository: MemoryInventoryItemRepository;
    reservationRepository: MemoryInventoryReservationRepository;
    replenishmentRepository: MemoryReplenishmentRepository;
    purchaseOrderRepository: MemoryPurchaseOrderRepository;
    procurementReportRepository: MemoryProcurementReportRepository;
  },
  items: readonly SeedDashboardScenarioInput[],
) {
  for (const [index, input] of items.entries()) {
    const storeId = input.storeId ?? TEST_STORE_A_ID;
    const subtotal = input.subtotal ?? "100.00";
    const total = input.total ?? subtotal;
    const customerId = crypto.randomUUID();

    await seedCustomerScenario(
      {
        customerRepository: module.customerRepository,
        customerAddressRepository: module.customerAddressRepository,
        orderRepository: module.orderRepository,
        paymentRepository: module.paymentRepository,
        refundRepository: module.refundRepository,
      },
      [
        {
          id: customerId,
          storeId,
          email: `dashboard-customer-${index}@example.com`,
        },
      ],
      [
        {
          storeId,
          customerProfileId: customerId,
          subtotal,
          total,
          status: "confirmed",
          paymentStatus: input.paymentStatus ?? "paid",
        },
      ],
    );

    await seedSalesScenario(
      {
        orderRepository: module.orderRepository,
        paymentRepository: module.paymentRepository,
        shipmentRepository: module.shipmentRepository,
      },
      [
        {
          storeId,
          subtotal,
          total,
          status: "confirmed",
          paymentStatus: input.paymentStatus ?? "paid",
          warehouseId: TEST_WAREHOUSE_A_ID,
        },
      ],
    );

    await seedInventoryReportingScenario(
      {
        inventoryItemRepository: module.inventoryItemRepository,
        reservationRepository: module.reservationRepository,
        replenishmentRepository: module.replenishmentRepository,
        purchaseOrderRepository: module.purchaseOrderRepository,
      },
      [
        {
          storeId,
          warehouseId: TEST_WAREHOUSE_A_ID,
          productVariantId: `bbbbbbbb-bbbb-bbbb-bbbb-${String(index).padStart(12, "0")}`,
          quantityOnHand: input.inventoryQuantity ?? 25,
          reorderPoint: input.reorderPoint,
        },
      ],
    );

    await seedProcurementScenario(
      { procurementReportRepository: module.procurementReportRepository },
      [
        {
          storeId,
          quantityOrdered: input.purchaseOrderQuantity ?? 10,
          shipmentStatus: "shipped",
          movementQuantity: -5,
        },
      ],
    );
  }
}
