import type {
  CatalogueListResult,
  CycleCount,
  CycleCountApprovalResult,
  CycleCountItem,
} from "@commerceflow/types";
import type {
  ListCycleCountsQuery,
  UpdateCycleCountInput,
} from "@commerceflow/validation";

export interface CreateCycleCountItemRecord {
  readonly inventoryItemId: string;
  readonly expectedQuantity: number;
}

export interface CreateCycleCountRecord {
  readonly storeId: string;
  readonly warehouseId: string;
  readonly cycleCountNumber: string;
  readonly items: readonly CreateCycleCountItemRecord[];
}

export interface ApproveCycleCountRecord {
  readonly storeId: string;
  readonly cycleCountId: string;
  readonly createdByUserId: string;
}

export interface CycleCountRepository {
  findById(storeId: string, id: string): Promise<CycleCount | null>;
  list(query: ListCycleCountsQuery): Promise<CatalogueListResult<CycleCount>>;
  create(record: CreateCycleCountRecord): Promise<CycleCount>;
  startCycleCount(
    storeId: string,
    id: string,
    startedAt: Date,
  ): Promise<CycleCount>;
  completeCycleCount(
    storeId: string,
    id: string,
    input: UpdateCycleCountInput,
    completedAt: Date,
  ): Promise<CycleCount>;
  approveCycleCount(
    record: ApproveCycleCountRecord,
    approvedAt: Date,
  ): Promise<CycleCountApprovalResult>;
}

export type { CycleCountItem };
