import { MemoryInventoryItemRepository } from "../../inventory/repositories/memory-inventory-item.repository";
import { MemoryStockMovementRepository } from "../../inventory/repositories/memory-stock-movement.repository";
import { InventoryService } from "../../inventory/services/inventory.service";
import { MemoryOrderRepository } from "../../orders/repositories/memory-order.repository";
import { MemoryOrderVariantSnapshotReader } from "../../orders/repositories/memory-order-variant-snapshot.reader";
import { OrderService } from "../../orders/services/order.service";
import { MemoryWarehouseRepository } from "@/warehouses/repositories/memory-warehouse.repository";
import { WarehouseService } from "@/warehouses/services/warehouse.service";
import { seedDefaultWarehouse } from "@/warehouses/testing/warehouse-test-utils";
import { MemoryInventoryReservationRepository } from "../repositories/memory-inventory-reservation.repository";
import { ReservationService } from "../services/reservation.service";

export const TEST_STORE_A_ID = "11111111-1111-1111-1111-111111111111";
export const TEST_STORE_B_ID = "22222222-2222-2222-2222-222222222222";
export const TEST_VARIANT_A_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
export const TEST_VARIANT_B_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

const sharedWarehouseRepository = new MemoryWarehouseRepository();

export function createMemoryReservationService(): {
  reservationService: ReservationService;
  orderService: OrderService;
  inventoryService: InventoryService;
  inventoryItemRepository: MemoryInventoryItemRepository;
  reservationRepository: MemoryInventoryReservationRepository;
  orderRepository: MemoryOrderRepository;
  variantSnapshotReader: MemoryOrderVariantSnapshotReader;
  warehouseRepository: MemoryWarehouseRepository;
  warehouseService: WarehouseService;
} {
  const inventoryItemRepository = new MemoryInventoryItemRepository();
  const stockMovementRepository = new MemoryStockMovementRepository(
    inventoryItemRepository,
  );
  const warehouseService = new WarehouseService({
    warehouseRepository: sharedWarehouseRepository,
  });
  const reservationRepository = new MemoryInventoryReservationRepository(
    inventoryItemRepository,
  );
  const orderRepository = new MemoryOrderRepository();
  const variantSnapshotReader = new MemoryOrderVariantSnapshotReader();

  return {
    inventoryItemRepository,
    reservationRepository,
    orderRepository,
    variantSnapshotReader,
    warehouseRepository: sharedWarehouseRepository,
    warehouseService,
    inventoryService: new InventoryService({
      inventoryItemRepository,
      stockMovementRepository,
      warehouseRepository: sharedWarehouseRepository,
    }),
    orderService: new OrderService({
      orderRepository,
      orderVariantSnapshotReader: variantSnapshotReader,
    }),
    reservationService: new ReservationService({
      inventoryReservationRepository: reservationRepository,
      orderRepository,
      inventoryItemRepository,
      warehouseRepository: sharedWarehouseRepository,
    }),
  };
}

export async function seedConfirmedOrderWithInventory(
  services: ReturnType<typeof createMemoryReservationService>,
  options: {
    storeId?: string;
    variantId?: string;
    initialQuantity?: number;
    orderQuantity?: number;
  } = {},
) {
  const storeId = options.storeId ?? TEST_STORE_A_ID;
  const variantId = options.variantId ?? TEST_VARIANT_A_ID;
  const initialQuantity = options.initialQuantity ?? 10;
  const orderQuantity = options.orderQuantity ?? 2;

  const existingWarehouse =
    await services.warehouseRepository.findDefaultByStoreId(storeId);
  const warehouse =
    existingWarehouse ??
    (await seedDefaultWarehouse(services.warehouseService, { storeId }));

  services.inventoryItemRepository.seedProductVariant(storeId, variantId);
  services.variantSnapshotReader.seedVariant({
    storeId,
    productVariantId: variantId,
    productName: "Classic Tee",
    sku: "TEE-001",
    unitPrice: "19.99",
    currency: "USD",
    isActive: true,
  });

  const { inventoryItem } = await services.inventoryService.createInventoryItem({
    storeId,
    warehouseId: warehouse.id,
    productVariantId: variantId,
    initialQuantity,
  });

  const draft = await services.orderService.createOrder({
    storeId,
    status: "draft",
    items: [{ productVariantId: variantId, quantity: orderQuantity }],
  });

  const confirmed = await services.orderService.confirmOrder(
    { storeId },
    draft.id,
  );

  return { inventoryItem, confirmed, warehouse };
}
