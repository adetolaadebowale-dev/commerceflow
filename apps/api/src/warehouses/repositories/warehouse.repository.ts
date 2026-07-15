import type { Warehouse } from "@commerceflow/types";
import type { CatalogueListResult } from "@commerceflow/types";
import type {
  CreateWarehouseInput,
  ListWarehousesQuery,
  UpdateWarehouseInput,
} from "@commerceflow/validation";

export interface WarehouseRepository {
  findById(storeId: string, id: string): Promise<Warehouse | null>;
  findDefaultByStoreId(storeId: string): Promise<Warehouse | null>;
  countActiveByStoreId(storeId: string): Promise<number>;
  list(query: ListWarehousesQuery): Promise<CatalogueListResult<Warehouse>>;
  create(input: CreateWarehouseInput): Promise<Warehouse>;
  update(
    storeId: string,
    id: string,
    input: UpdateWarehouseInput,
  ): Promise<Warehouse>;
  activate(storeId: string, id: string): Promise<Warehouse>;
  deactivate(storeId: string, id: string): Promise<Warehouse>;
  softDelete(storeId: string, id: string): Promise<Warehouse>;
}
