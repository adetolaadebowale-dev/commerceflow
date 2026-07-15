import type { CreateWarehouseInput } from "@commerceflow/validation";

import type { DomainEventPublisher } from "@/domain-events";
import { MemoryWarehouseRepository } from "../repositories/memory-warehouse.repository";
import { WarehouseService } from "../services/warehouse.service";

export const TEST_STORE_A_ID = "11111111-1111-1111-1111-111111111111";
export const TEST_STORE_B_ID = "22222222-2222-2222-2222-222222222222";

export function createMemoryWarehouseModule(
  options: {
    domainEventPublisher?: DomainEventPublisher;
  } = {},
) {
  const warehouseRepository = new MemoryWarehouseRepository();

  return {
    warehouseRepository,
    warehouseService: new WarehouseService({
      warehouseRepository,
      domainEventPublisher: options.domainEventPublisher,
    }),
  };
}

export function validWarehouseInput(
  overrides: Partial<CreateWarehouseInput> = {},
): CreateWarehouseInput {
  return {
    storeId: TEST_STORE_A_ID,
    name: "Main Warehouse",
    code: "MAIN",
    address: "123 Industrial Pkwy",
    city: "Austin",
    stateProvince: "TX",
    postalCode: "78701",
    countryCode: "US",
    status: "active",
    isDefault: false,
    ...overrides,
  };
}

export async function seedDefaultWarehouse(
  warehouseService: WarehouseService,
  overrides: Partial<CreateWarehouseInput> = {},
) {
  return warehouseService.createWarehouse(
    validWarehouseInput({
      name: "Default Warehouse",
      code: "DEFAULT",
      isDefault: true,
      ...overrides,
    }),
  );
}
