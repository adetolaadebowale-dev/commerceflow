import type {
  CreateExportJobInput,
  CreateImportJobInput,
} from "@commerceflow/validation";

import type { DomainEventPublisher } from "@/domain-events";
import type { ExportProcessor, ImportProcessor } from "../processors";
import { MemoryExportRepository } from "../repositories/memory-export.repository";
import { MemoryImportRepository } from "../repositories/memory-import.repository";
import { DataTransferService } from "../services/data-transfer.service";

export const TEST_STORE_A_ID = "11111111-1111-1111-1111-111111111111";
export const TEST_STORE_B_ID = "22222222-2222-2222-2222-222222222222";

export function createMemoryDataTransferModule(options: {
  domainEventPublisher?: DomainEventPublisher;
  importProcessor?: ImportProcessor;
  exportProcessor?: ExportProcessor;
} = {}) {
  const importRepository = new MemoryImportRepository();
  const exportRepository = new MemoryExportRepository();

  return {
    importRepository,
    exportRepository,
    dataTransferService: new DataTransferService({
      importRepository,
      exportRepository,
      domainEventPublisher: options.domainEventPublisher,
      importProcessor: options.importProcessor,
      exportProcessor: options.exportProcessor,
    }),
  };
}

export function validCreateImportJobInput(
  overrides: Partial<CreateImportJobInput> = {},
): CreateImportJobInput {
  return {
    storeId: TEST_STORE_A_ID,
    type: "customers",
    format: "csv",
    metadata: {},
    ...overrides,
  };
}

export function validCreateExportJobInput(
  overrides: Partial<CreateExportJobInput> = {},
): CreateExportJobInput {
  return {
    storeId: TEST_STORE_A_ID,
    type: "products",
    format: "csv",
    metadata: {},
    ...overrides,
  };
}
