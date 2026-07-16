import { MemoryInventoryItemRepository } from "@/inventory/repositories/memory-inventory-item.repository";
import { MemoryStockMovementRepository } from "@/inventory/repositories/memory-stock-movement.repository";
import { MemoryInventoryAllocationRepository } from "@/inventory-allocation/repositories/memory-inventory-allocation.repository";
import { MemoryPurchaseOrderRepository } from "@/purchase-orders/repositories/memory-purchase-order.repository";
import { MemoryInventoryReservationRepository } from "@/reservations/repositories/memory-inventory-reservation.repository";
import { MemoryReplenishmentRepository } from "@/replenishment/repositories/memory-replenishment.repository";

import { DefaultInventoryReportRepository } from "./default-inventory-report.repository";
import type { InventoryReportRepository } from "./inventory-report.repository";

export class MemoryInventoryReportRepository
  extends DefaultInventoryReportRepository
  implements InventoryReportRepository
{
  constructor(
    inventoryItemRepository: MemoryInventoryItemRepository,
    stockMovementRepository: MemoryStockMovementRepository,
    reservationRepository: MemoryInventoryReservationRepository,
    allocationRepository: MemoryInventoryAllocationRepository,
    purchaseOrderRepository: MemoryPurchaseOrderRepository,
    replenishmentRepository: MemoryReplenishmentRepository,
  ) {
    super(
      inventoryItemRepository,
      stockMovementRepository,
      reservationRepository,
      allocationRepository,
      purchaseOrderRepository,
      replenishmentRepository,
    );
  }
}
