export {
  WarehouseService,
  warehouseService,
  type WarehouseServiceDependencies,
} from "./warehouse.service";

import { warehouseService } from "./warehouse.service";

export function getWarehouseService() {
  return warehouseService;
}
