import type { IntegrityCheckResult } from "@commerceflow/types";
import type { OperationsStoreQuery } from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import {
  getOperationsContextProvider,
  type OperationsContextProvider,
} from "../providers";
import { InventoryIntegrityService } from "./inventory-integrity.service";
import { OperationsReadService } from "./operations-read.service";
import { buildIntegrityResult } from "./operations-utils";
import { WarehouseConsistencyService } from "./warehouse-consistency.service";

export interface OperationalIntegrityServiceDependencies {
  readonly contextProvider?: OperationsContextProvider;
  readonly warehouseConsistencyService?: WarehouseConsistencyService;
  readonly inventoryIntegrityService?: InventoryIntegrityService;
  readonly operationsReadService?: OperationsReadService;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class OperationalIntegrityService {
  private readonly contextProvider: OperationsContextProvider;
  private readonly warehouseConsistencyService: WarehouseConsistencyService;
  private readonly inventoryIntegrityService: InventoryIntegrityService;
  private readonly operationsReadService: OperationsReadService;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: OperationalIntegrityServiceDependencies = {}) {
    this.contextProvider =
      dependencies.contextProvider ?? getOperationsContextProvider();
    this.warehouseConsistencyService =
      dependencies.warehouseConsistencyService ?? new WarehouseConsistencyService();
    this.inventoryIntegrityService =
      dependencies.inventoryIntegrityService ?? new InventoryIntegrityService();
    this.operationsReadService =
      dependencies.operationsReadService ?? new OperationsReadService();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async getWarehouseOperationalSummary(query: OperationsStoreQuery) {
    const context = await this.contextProvider.loadContext(query.storeId);
    return this.operationsReadService.buildWarehouseOperationalSummary(context);
  }

  async getFulfillmentDashboard(query: OperationsStoreQuery) {
    const context = await this.contextProvider.loadContext(query.storeId);
    return this.operationsReadService.buildFulfillmentDashboard(context);
  }

  async getProcurementDashboard(query: OperationsStoreQuery) {
    const context = await this.contextProvider.loadContext(query.storeId);
    return this.operationsReadService.buildProcurementDashboard(context);
  }

  async getInventoryHealthSummary(query: OperationsStoreQuery) {
    const context = await this.contextProvider.loadContext(query.storeId);
    return this.operationsReadService.buildInventoryHealthSummary(context);
  }

  async runIntegrityCheck(query: OperationsStoreQuery): Promise<IntegrityCheckResult> {
    const context = await this.contextProvider.loadContext(query.storeId);
    const warehouseResult = this.warehouseConsistencyService.validate(context);
    const inventoryResult = this.inventoryIntegrityService.validate(context);
    const combined = buildIntegrityResult([
      ...warehouseResult.issues,
      ...inventoryResult.issues,
    ]);

    this.domainEventPublisher.publishWarehouseIntegrityChecked(
      query.storeId,
      warehouseResult,
    );
    this.domainEventPublisher.publishInventoryIntegrityChecked(
      query.storeId,
      inventoryResult,
    );
    this.domainEventPublisher.publishOperationsIntegrityChecked(
      query.storeId,
      combined,
    );

    return combined;
  }

  async runWarehouseValidation(
    query: OperationsStoreQuery,
  ): Promise<IntegrityCheckResult> {
    const context = await this.contextProvider.loadContext(query.storeId);
    const result = this.warehouseConsistencyService.validate(context);
    this.domainEventPublisher.publishWarehouseIntegrityChecked(
      query.storeId,
      result,
    );
    return result;
  }

  async runInventoryValidation(
    query: OperationsStoreQuery,
  ): Promise<IntegrityCheckResult> {
    const context = await this.contextProvider.loadContext(query.storeId);
    const result = this.inventoryIntegrityService.validate(context);
    this.domainEventPublisher.publishInventoryIntegrityChecked(
      query.storeId,
      result,
    );
    return result;
  }
}

export const operationalIntegrityService = new OperationalIntegrityService();
