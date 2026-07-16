import type {
  PurchaseOrder,
  ReplenishmentRecommendation,
  Shipment,
  StockMovement,
  Supplier,
  Warehouse,
  WarehouseTransfer,
} from "@commerceflow/types";

import type { MemoryProcurementReportRepository } from "../repositories/memory-procurement-report.repository";
import {
  TEST_STORE_A_ID,
  TEST_SUPPLIER_A_ID,
  TEST_VARIANT_A_ID,
  TEST_WAREHOUSE_A_ID,
  TEST_WAREHOUSE_B_ID,
} from "./procurement-test-utils";

export interface SeedProcurementScenarioInput {
  readonly storeId?: string;
  readonly warehouseId?: string;
  readonly supplierId?: string;
  readonly purchaseOrderStatus?: PurchaseOrder["status"];
  readonly quantityOrdered?: number;
  readonly quantityReceived?: number;
  readonly unitCost?: string;
  readonly orderedAt?: string;
  readonly receivedAt?: string;
  readonly expectedDeliveryDate?: string;
  readonly transferQuantity?: number;
  readonly transferStatus?: WarehouseTransfer["status"];
  readonly recommendationStatus?: ReplenishmentRecommendation["status"];
  readonly shipmentStatus?: Shipment["status"];
  readonly inventoryQuantity?: number;
  readonly movementQuantity?: number;
}

export async function seedProcurementScenario(
  module: {
    procurementReportRepository: MemoryProcurementReportRepository;
  },
  items: readonly SeedProcurementScenarioInput[],
) {
  const now = new Date().toISOString();

  module.procurementReportRepository.seedSupplier(
    buildSupplier({
      id: TEST_SUPPLIER_A_ID,
      storeId: TEST_STORE_A_ID,
    }),
  );
  module.procurementReportRepository.seedWarehouse(
    buildWarehouse({
      id: TEST_WAREHOUSE_A_ID,
      storeId: TEST_STORE_A_ID,
      name: "Warehouse A",
      code: "WH-A",
    }),
  );
  module.procurementReportRepository.seedWarehouse(
    buildWarehouse({
      id: TEST_WAREHOUSE_B_ID,
      storeId: TEST_STORE_A_ID,
      name: "Warehouse B",
      code: "WH-B",
    }),
  );

  for (const input of items) {
    const storeId = input.storeId ?? TEST_STORE_A_ID;
    const warehouseId = input.warehouseId ?? TEST_WAREHOUSE_A_ID;
    const supplierId = input.supplierId ?? TEST_SUPPLIER_A_ID;
    const inventoryItemId = crypto.randomUUID();
    const purchaseOrderId = crypto.randomUUID();

    module.procurementReportRepository.seedInventoryItem({
      id: inventoryItemId,
      storeId,
      warehouseId,
      productVariantId: TEST_VARIANT_A_ID,
      quantityOnHand: input.inventoryQuantity ?? 50,
      createdAt: now,
      updatedAt: now,
    });

    module.procurementReportRepository.seedPurchaseOrder(
      buildPurchaseOrder({
        id: purchaseOrderId,
        storeId,
        warehouseId,
        supplierId,
        status: input.purchaseOrderStatus ?? "ordered",
        quantityOrdered: input.quantityOrdered ?? 100,
        quantityReceived: input.quantityReceived ?? 0,
        unitCost: input.unitCost ?? "10.00",
        orderedAt: input.orderedAt ?? now,
        receivedAt: input.receivedAt,
        expectedDeliveryDate: input.expectedDeliveryDate,
      }),
    );

    if (input.transferQuantity !== undefined) {
      module.procurementReportRepository.seedWarehouseTransfer(
        buildWarehouseTransfer({
          storeId,
          sourceWarehouseId: warehouseId,
          destinationWarehouseId: TEST_WAREHOUSE_B_ID,
          quantity: input.transferQuantity,
          status: input.transferStatus ?? "received",
        }),
      );
    }

    if (input.recommendationStatus !== undefined) {
      module.procurementReportRepository.seedRecommendation(
        buildRecommendation({
          storeId,
          warehouseId,
          supplierId,
          status: input.recommendationStatus,
          purchaseOrderId:
            input.recommendationStatus === "accepted" ? purchaseOrderId : undefined,
        }),
      );
    }

    if (input.shipmentStatus !== undefined) {
      module.procurementReportRepository.seedShipment(
        buildShipment({
          storeId,
          warehouseId,
          status: input.shipmentStatus,
        }),
      );
    }

    if (input.movementQuantity !== undefined) {
      module.procurementReportRepository.seedStockMovement(
        buildStockMovement({
          storeId,
          warehouseId,
          inventoryItemId,
          quantity: input.movementQuantity,
        }),
      );
    }
  }
}

function buildSupplier(input: {
  id: string;
  storeId: string;
}): Supplier {
  const now = new Date().toISOString();

  return {
    id: input.id,
    storeId: input.storeId,
    code: "ACME",
    name: "Acme Supplies",
    paymentTerm: "net30",
    currency: "USD",
    status: "active",
    contacts: [],
    createdAt: now,
    updatedAt: now,
  };
}

function buildWarehouse(input: {
  id: string;
  storeId: string;
  name: string;
  code: string;
}): Warehouse {
  const now = new Date().toISOString();

  return {
    id: input.id,
    storeId: input.storeId,
    name: input.name,
    code: input.code,
    address: "123 Main St",
    city: "New York",
    stateProvince: "NY",
    postalCode: "10001",
    countryCode: "US",
    status: "active",
    isDefault: input.id === TEST_WAREHOUSE_A_ID,
    createdAt: now,
    updatedAt: now,
  };
}

function buildPurchaseOrder(input: {
  id: string;
  storeId: string;
  warehouseId: string;
  supplierId: string;
  status: PurchaseOrder["status"];
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: string;
  orderedAt?: string;
  receivedAt?: string;
  expectedDeliveryDate?: string;
}): PurchaseOrder {
  const now = new Date().toISOString();
  const lineId = crypto.randomUUID();

  return {
    id: input.id,
    storeId: input.storeId,
    warehouseId: input.warehouseId,
    supplierId: input.supplierId,
    purchaseOrderNumber: `PO-${input.id.slice(0, 8)}`,
    status: input.status,
    orderedAt: input.orderedAt,
    receivedAt: input.receivedAt,
    expectedDeliveryDate: input.expectedDeliveryDate,
    items: [
      {
        id: lineId,
        purchaseOrderId: input.id,
        productVariantId: TEST_VARIANT_A_ID,
        quantityOrdered: input.quantityOrdered,
        quantityReceived: input.quantityReceived,
        unitCost: input.unitCost,
        currency: "USD",
        createdAt: now,
        updatedAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

function buildWarehouseTransfer(input: {
  storeId: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  quantity: number;
  status: WarehouseTransfer["status"];
}): WarehouseTransfer {
  const now = new Date().toISOString();
  const transferId = crypto.randomUUID();
  const itemId = crypto.randomUUID();

  return {
    id: transferId,
    storeId: input.storeId,
    transferNumber: `WT-${transferId.slice(0, 8)}`,
    sourceWarehouseId: input.sourceWarehouseId,
    destinationWarehouseId: input.destinationWarehouseId,
    status: input.status,
    receivedAt: input.status === "received" ? now : undefined,
    items: [
      {
        id: itemId,
        warehouseTransferId: transferId,
        inventoryItemId: crypto.randomUUID(),
        quantity: input.quantity,
        createdAt: now,
        updatedAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

function buildRecommendation(input: {
  storeId: string;
  warehouseId: string;
  supplierId: string;
  status: ReplenishmentRecommendation["status"];
  purchaseOrderId?: string;
}): ReplenishmentRecommendation {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    storeId: input.storeId,
    warehouseId: input.warehouseId,
    supplierId: input.supplierId,
    productVariantId: TEST_VARIANT_A_ID,
    recommendedQuantity: 25,
    currentQuantity: 5,
    reorderPoint: 10,
    status: input.status,
    purchaseOrderId: input.purchaseOrderId,
    createdAt: now,
    updatedAt: now,
  };
}

function buildShipment(input: {
  storeId: string;
  warehouseId: string;
  status: Shipment["status"];
}): Shipment {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    storeId: input.storeId,
    orderId: crypto.randomUUID(),
    shipmentNumber: `SH-${crypto.randomUUID().slice(0, 8)}`,
    carrier: "manual",
    shippingRecipientName: "Jane Doe",
    shippingPhone: "+15555550100",
    shippingAddressLine1: "123 Main St",
    shippingCity: "New York",
    shippingStateProvince: "NY",
    shippingPostalCode: "10001",
    shippingCountryCode: "US",
    status: input.status,
    warehouseId: input.warehouseId,
    shippedAt: input.status === "shipped" || input.status === "delivered" ? now : undefined,
    deliveredAt: input.status === "delivered" ? now : undefined,
    createdAt: now,
    updatedAt: now,
  };
}

function buildStockMovement(input: {
  storeId: string;
  warehouseId: string;
  inventoryItemId: string;
  quantity: number;
}): StockMovement {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    storeId: input.storeId,
    warehouseId: input.warehouseId,
    inventoryItemId: input.inventoryItemId,
    movementType: "fulfillment",
    quantity: input.quantity,
    previousQuantityOnHand: 50,
    newQuantityOnHand: 50 + input.quantity,
    createdAt: now,
  };
}
