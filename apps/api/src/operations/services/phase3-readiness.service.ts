import type {
  IntegrityCheckResult,
  IntegrityIssue,
  Phase3ReadinessReport,
  Phase3ValidationResult,
  ReadinessStatus,
} from "@commerceflow/types";
import type { OperationsStoreQuery } from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import { PickListStatusTransitionPolicy } from "@/pick-lists/policies/pick-list-status-transition.policy";
import {
  getOperationsContextProvider,
  type OperationsContextProvider,
} from "../providers";
import type { OperationsContext } from "../providers/operations-context";
import { InventoryIntegrityService } from "./inventory-integrity.service";
import { OperationsReadService } from "./operations-read.service";
import {
  buildIntegrityResult,
  OPERATIONS_INTEGRITY_CODES,
  PHASE3_READINESS_CODES,
} from "./operations-utils";
import { WarehouseConsistencyService } from "./warehouse-consistency.service";

export interface Phase3ReadinessServiceDependencies {
  readonly contextProvider?: OperationsContextProvider;
  readonly warehouseConsistencyService?: WarehouseConsistencyService;
  readonly inventoryIntegrityService?: InventoryIntegrityService;
  readonly operationsReadService?: OperationsReadService;
  readonly domainEventPublisher?: DomainEventPublisher;
}

const WAREHOUSE_ISSUE_CODES = new Set<string>([
  OPERATIONS_INTEGRITY_CODES.TRANSFER_FULFILLMENT_CONFLICT,
  PHASE3_READINESS_CODES.WAREHOUSE_INTEGRITY_VIOLATION,
  PHASE3_READINESS_CODES.MULTI_DEFAULT_WAREHOUSE,
  PHASE3_READINESS_CODES.INACTIVE_WAREHOUSE_WITH_INVENTORY,
  PHASE3_READINESS_CODES.ORPHANED_INVENTORY_ITEM,
]);

const INVENTORY_ISSUE_CODES = new Set<string>([
  OPERATIONS_INTEGRITY_CODES.ADJUSTMENT_WAREHOUSE_MISMATCH,
  PHASE3_READINESS_CODES.STOCK_LEDGER_INCONSISTENT,
  PHASE3_READINESS_CODES.ORPHANED_RESERVATION,
  PHASE3_READINESS_CODES.SNAPSHOT_REFERENCE_MISSING,
]);

const FULFILLMENT_ISSUE_CODES = new Set<string>([
  OPERATIONS_INTEGRITY_CODES.SHIPMENT_PICK_STATE_MISMATCH,
  OPERATIONS_INTEGRITY_CODES.SHIPMENT_ALLOCATION_INCOMPLETE,
  OPERATIONS_INTEGRITY_CODES.ALLOCATION_NOT_RELEASED,
  PHASE3_READINESS_CODES.ORPHANED_PICK_LIST,
  PHASE3_READINESS_CODES.ORPHANED_ALLOCATION,
]);

const PROCUREMENT_ISSUE_CODES = new Set<string>([
  PHASE3_READINESS_CODES.SNAPSHOT_REFERENCE_MISSING,
]);

const SHIPMENT_ISSUE_CODES = new Set<string>([
  OPERATIONS_INTEGRITY_CODES.SHIPMENT_PICK_STATE_MISMATCH,
  OPERATIONS_INTEGRITY_CODES.SHIPMENT_ALLOCATION_INCOMPLETE,
  PHASE3_READINESS_CODES.INVALID_LIFECYCLE_STATE,
  PHASE3_READINESS_CODES.ORPHANED_PICK_LIST,
]);

const RETURN_ISSUE_CODES = new Set<string>([
  OPERATIONS_INTEGRITY_CODES.RETURN_REPLENISHMENT_MISMATCH,
  PHASE3_READINESS_CODES.ORPHANED_RETURN,
  PHASE3_READINESS_CODES.INVALID_LIFECYCLE_STATE,
]);

const REPLENISHMENT_ISSUE_CODES = new Set<string>([
  OPERATIONS_INTEGRITY_CODES.PO_REPLENISHMENT_STALE,
  OPERATIONS_INTEGRITY_CODES.RETURN_REPLENISHMENT_MISMATCH,
  OPERATIONS_INTEGRITY_CODES.CYCLE_COUNT_REPLENISHMENT_STALE,
]);

export class Phase3ReadinessService {
  private readonly contextProvider: OperationsContextProvider;
  private readonly warehouseConsistencyService: WarehouseConsistencyService;
  private readonly inventoryIntegrityService: InventoryIntegrityService;
  private readonly operationsReadService: OperationsReadService;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: Phase3ReadinessServiceDependencies = {}) {
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

  async runPhase3Validation(
    query: OperationsStoreQuery,
  ): Promise<Phase3ValidationResult> {
    const context = await this.contextProvider.loadContext(query.storeId);
    const result = this.validate(context);

    this.domainEventPublisher.publishOperationsPhase3ValidationCompleted(
      query.storeId,
      result,
    );

    return result;
  }

  async getReadinessReport(
    query: OperationsStoreQuery,
  ): Promise<Phase3ReadinessReport> {
    const context = await this.contextProvider.loadContext(query.storeId);
    const validation = this.validate(context);
    const report = this.buildReadinessReport(context, validation);

    this.domainEventPublisher.publishOperationsReadinessGenerated(
      query.storeId,
      report,
    );

    return report;
  }

  validate(context: OperationsContext): Phase3ValidationResult {
    const warehouseResult = this.warehouseConsistencyService.validate(context);
    const inventoryResult = this.inventoryIntegrityService.validate(context);
    const phase3Issues = this.validatePhase3Readiness(context);
    const combined = buildIntegrityResult([
      ...warehouseResult.issues,
      ...inventoryResult.issues,
      ...phase3Issues,
    ]);
    const overallStatus = this.computeOverallStatus(context, combined);

    return {
      ...combined,
      overallStatus,
    };
  }

  buildReadinessReport(
    context: OperationsContext,
    validation: Phase3ValidationResult,
  ): Phase3ReadinessReport {
    const warehouseSummary =
      this.operationsReadService.buildWarehouseOperationalSummary(context);
    const fulfillmentDashboard =
      this.operationsReadService.buildFulfillmentDashboard(context);
    const procurementDashboard =
      this.operationsReadService.buildProcurementDashboard(context);
    const inventorySummary =
      this.operationsReadService.buildInventoryHealthSummary(context);

    const warehouseIssues = this.filterIssues(validation.issues, WAREHOUSE_ISSUE_CODES);
    const inventoryIssues = this.filterIssues(validation.issues, INVENTORY_ISSUE_CODES);
    const fulfillmentIssues = this.filterIssues(
      validation.issues,
      FULFILLMENT_ISSUE_CODES,
    );
    const procurementIssues = this.filterIssues(
      validation.issues,
      PROCUREMENT_ISSUE_CODES,
      (issue) => issue.entityType === "purchase_order" || issue.entityType === "supplier",
    );
    const shipmentIssues = this.filterIssues(validation.issues, SHIPMENT_ISSUE_CODES);
    const returnIssues = this.filterIssues(validation.issues, RETURN_ISSUE_CODES);
    const replenishmentIssues = this.filterIssues(
      validation.issues,
      REPLENISHMENT_ISSUE_CODES,
    );

    const warehouseHealth = {
      status: this.deriveSectionStatus(warehouseIssues, 0),
      issueCount: warehouseIssues.length,
      warningCount: 0,
      warehouseCount: warehouseSummary.warehouseCount,
      activeWarehouseCount: warehouseSummary.activeWarehouseCount,
      inTransitTransferCount: warehouseSummary.inTransitTransferCount,
      pendingTransferCount: warehouseSummary.pendingTransferCount,
    };

    const inventoryHealth = {
      status: this.deriveSectionStatus(
        inventoryIssues,
        inventorySummary.lowStockItemCount + inventorySummary.openCycleCountCount,
      ),
      issueCount: inventoryIssues.length,
      warningCount:
        inventorySummary.lowStockItemCount + inventorySummary.openCycleCountCount,
      inventoryItemCount: inventorySummary.inventoryItemCount,
      lowStockItemCount: inventorySummary.lowStockItemCount,
      negativeQuantityItemCount: inventorySummary.negativeQuantityItemCount,
      activeReservationCount: inventorySummary.activeReservationCount,
      openCycleCountCount: inventorySummary.openCycleCountCount,
    };

    const activePickListCount = context.pickLists.filter((pickList) =>
      PickListStatusTransitionPolicy.isActive(pickList.status),
    ).length;

    const fulfillmentHealth = {
      status: this.deriveSectionStatus(fulfillmentIssues, 0),
      issueCount: fulfillmentIssues.length,
      warningCount: 0,
      pendingShipmentCount: fulfillmentDashboard.pendingShipmentCount,
      packedShipmentCount: fulfillmentDashboard.packedShipmentCount,
      openAllocationCount: fulfillmentDashboard.openAllocationCount,
      activePickListCount,
    };

    const pendingPurchaseOrderCount = context.purchaseOrders.filter(
      (purchaseOrder) =>
        purchaseOrder.status === "approved" || purchaseOrder.status === "ordered",
    ).length;

    const procurementHealth = {
      status: this.deriveSectionStatus(
        procurementIssues,
        procurementDashboard.pendingRecommendationCount +
          procurementDashboard.draftPurchaseOrderCount,
      ),
      issueCount: procurementIssues.length,
      warningCount:
        procurementDashboard.pendingRecommendationCount +
        procurementDashboard.draftPurchaseOrderCount,
      activeSupplierCount: procurementDashboard.activeSupplierCount,
      draftPurchaseOrderCount: procurementDashboard.draftPurchaseOrderCount,
      pendingPurchaseOrderCount,
    };

    const inTransitShipmentCount = context.shipments.filter(
      (shipment) => shipment.status === "shipped",
    ).length;
    const deliveredShipmentCount = context.shipments.filter(
      (shipment) => shipment.status === "delivered",
    ).length;

    const shipmentHealth = {
      status: this.deriveSectionStatus(shipmentIssues, 0),
      issueCount: shipmentIssues.length,
      warningCount: 0,
      activeShipmentCount: warehouseSummary.activeShipmentCount,
      inTransitShipmentCount,
      deliveredShipmentCount,
    };

    const openReturnCount = context.returns.filter(
      (record) => record.status !== "completed" && record.status !== "rejected",
    ).length;
    const completedReturnCount = context.returns.filter(
      (record) => record.status === "completed",
    ).length;
    const pendingInspectionCount = context.returns.filter(
      (record) => record.status === "received",
    ).length;

    const returnHealth = {
      status: this.deriveSectionStatus(returnIssues, openReturnCount),
      issueCount: returnIssues.length,
      warningCount: openReturnCount,
      openReturnCount,
      completedReturnCount,
      pendingInspectionCount,
    };

    const staleRecommendationCount = replenishmentIssues.length;

    const replenishmentHealth = {
      status: this.deriveSectionStatus(
        replenishmentIssues,
        procurementDashboard.pendingRecommendationCount,
      ),
      issueCount: replenishmentIssues.length,
      warningCount: procurementDashboard.pendingRecommendationCount,
      pendingRecommendationCount: procurementDashboard.pendingRecommendationCount,
      activeReplenishmentRuleCount:
        procurementDashboard.activeReplenishmentRuleCount,
      staleRecommendationCount,
    };

    const sectionStatuses = [
      warehouseHealth.status,
      inventoryHealth.status,
      fulfillmentHealth.status,
      procurementHealth.status,
      shipmentHealth.status,
      returnHealth.status,
      replenishmentHealth.status,
    ];

    return {
      storeId: context.storeId,
      generatedAt: new Date().toISOString(),
      overallStatus: this.deriveOverallStatus(sectionStatuses, validation.overallStatus),
      validation,
      warehouseHealth,
      inventoryHealth,
      fulfillmentHealth,
      procurementHealth,
      shipmentHealth,
      returnHealth,
      replenishmentHealth,
    };
  }

  private validatePhase3Readiness(context: OperationsContext): IntegrityIssue[] {
    return [
      ...this.validateOrphanedRecords(context),
      ...this.validateInvalidLifecycleStates(context),
      ...this.validateSnapshotIntegrity(context),
      ...this.validateStockLedgerConsistency(context),
      ...this.validateWarehouseIntegrity(context),
    ];
  }

  private validateOrphanedRecords(context: OperationsContext): IntegrityIssue[] {
    const issues: IntegrityIssue[] = [];
    const shipmentIds = new Set(context.shipments.map((shipment) => shipment.id));
    const inventoryItemIds = new Set(
      context.inventoryItems.map((item) => item.id),
    );
    const warehouseIds = new Set(context.warehouses.map((warehouse) => warehouse.id));
    const pickListItemIds = new Set(
      context.pickLists.flatMap((pickList) => pickList.items.map((item) => item.id)),
    );

    for (const pickList of context.pickLists) {
      if (!shipmentIds.has(pickList.shipmentId)) {
        issues.push({
          code: PHASE3_READINESS_CODES.ORPHANED_PICK_LIST,
          message: "Pick list references a missing shipment",
          entityType: "pick_list",
          entityId: pickList.id,
        });
      }
    }

    for (const allocation of context.allocations) {
      if (!pickListItemIds.has(allocation.pickListItemId)) {
        issues.push({
          code: PHASE3_READINESS_CODES.ORPHANED_ALLOCATION,
          message: "Inventory allocation references a missing pick list item",
          entityType: "inventory_allocation",
          entityId: allocation.id,
        });
      }
    }

    for (const reservation of context.reservations) {
      if (!inventoryItemIds.has(reservation.inventoryItemId)) {
        issues.push({
          code: PHASE3_READINESS_CODES.ORPHANED_RESERVATION,
          message: "Reservation references a missing inventory item",
          entityType: "inventory_reservation",
          entityId: reservation.id,
        });
      }
    }

    for (const record of context.returns) {
      if (!shipmentIds.has(record.shipmentId)) {
        issues.push({
          code: PHASE3_READINESS_CODES.ORPHANED_RETURN,
          message: "Return references a missing shipment",
          entityType: "return",
          entityId: record.id,
        });
      }
    }

    for (const item of context.inventoryItems) {
      if (!warehouseIds.has(item.warehouseId)) {
        issues.push({
          code: PHASE3_READINESS_CODES.ORPHANED_INVENTORY_ITEM,
          message: "Inventory item references a missing warehouse",
          entityType: "inventory_item",
          entityId: item.id,
        });
      }
    }

    return issues;
  }

  private validateInvalidLifecycleStates(
    context: OperationsContext,
  ): IntegrityIssue[] {
    const issues: IntegrityIssue[] = [];
    const shipmentById = new Map(
      context.shipments.map((shipment) => [shipment.id, shipment]),
    );

    for (const shipment of context.shipments) {
      if (
        (shipment.status === "delivered" || shipment.status === "shipped") &&
        !shipment.fulfilledAt
      ) {
        issues.push({
          code: PHASE3_READINESS_CODES.INVALID_LIFECYCLE_STATE,
          message:
            "Shipment progressed to shipped or delivered without warehouse fulfillment",
          entityType: "shipment",
          entityId: shipment.id,
        });
      }
    }

    for (const record of context.returns) {
      if (record.status !== "completed" && record.status !== "rejected") {
        continue;
      }

      const shipment = shipmentById.get(record.shipmentId);

      if (
        shipment &&
        shipment.status !== "delivered" &&
        shipment.status !== "shipped"
      ) {
        issues.push({
          code: PHASE3_READINESS_CODES.INVALID_LIFECYCLE_STATE,
          message: "Completed return references a shipment that was not shipped",
          entityType: "return",
          entityId: record.id,
        });
      }
    }

    for (const reservation of context.reservations) {
      if (reservation.status === "active" && reservation.fulfilledAt) {
        issues.push({
          code: PHASE3_READINESS_CODES.INVALID_LIFECYCLE_STATE,
          message: "Active reservation has a fulfilled timestamp",
          entityType: "inventory_reservation",
          entityId: reservation.id,
        });
      }
    }

    return issues;
  }

  private validateSnapshotIntegrity(context: OperationsContext): IntegrityIssue[] {
    const issues: IntegrityIssue[] = [];
    const supplierIds = new Set(context.suppliers.map((supplier) => supplier.id));

    for (const purchaseOrder of context.purchaseOrders) {
      if (!supplierIds.has(purchaseOrder.supplierId)) {
        issues.push({
          code: PHASE3_READINESS_CODES.SNAPSHOT_REFERENCE_MISSING,
          message: "Purchase order references a missing supplier",
          entityType: "purchase_order",
          entityId: purchaseOrder.id,
        });
      }
    }

    for (const rule of context.replenishmentRules) {
      if (!supplierIds.has(rule.supplierId)) {
        issues.push({
          code: PHASE3_READINESS_CODES.SNAPSHOT_REFERENCE_MISSING,
          message: "Replenishment rule references a missing supplier",
          entityType: "replenishment_rule",
          entityId: rule.id,
        });
      }
    }

    return issues;
  }

  private validateStockLedgerConsistency(
    context: OperationsContext,
  ): IntegrityIssue[] {
    const issues: IntegrityIssue[] = [];
    const reservedByItemId = new Map<string, number>();

    for (const reservation of context.reservations) {
      if (reservation.status !== "active") {
        continue;
      }

      reservedByItemId.set(
        reservation.inventoryItemId,
        (reservedByItemId.get(reservation.inventoryItemId) ?? 0) +
          reservation.reservedQuantity,
      );
    }

    for (const item of context.inventoryItems) {
      if (item.quantityOnHand < 0) {
        issues.push({
          code: PHASE3_READINESS_CODES.STOCK_LEDGER_INCONSISTENT,
          message: "Inventory item has negative on-hand quantity",
          entityType: "inventory_item",
          entityId: item.id,
        });
      }

      const reservedQuantity = reservedByItemId.get(item.id) ?? 0;

      if (reservedQuantity > item.quantityOnHand) {
        issues.push({
          code: PHASE3_READINESS_CODES.STOCK_LEDGER_INCONSISTENT,
          message:
            "Active reservations exceed on-hand inventory for inventory item",
          entityType: "inventory_item",
          entityId: item.id,
        });
      }
    }

    return issues;
  }

  private validateWarehouseIntegrity(context: OperationsContext): IntegrityIssue[] {
    const issues: IntegrityIssue[] = [];
    const defaultWarehouses = context.warehouses.filter(
      (warehouse) => warehouse.isDefault,
    );

    if (defaultWarehouses.length > 1) {
      issues.push({
        code: PHASE3_READINESS_CODES.MULTI_DEFAULT_WAREHOUSE,
        message: "Multiple default warehouses detected for store",
        entityType: "warehouse",
        entityId: defaultWarehouses[0]?.id,
      });
    }

    const inactiveWarehouseIds = new Set(
      context.warehouses
        .filter((warehouse) => warehouse.status !== "active")
        .map((warehouse) => warehouse.id),
    );

    for (const item of context.inventoryItems) {
      if (
        inactiveWarehouseIds.has(item.warehouseId) &&
        item.quantityOnHand > 0
      ) {
        issues.push({
          code: PHASE3_READINESS_CODES.INACTIVE_WAREHOUSE_WITH_INVENTORY,
          message: "Inactive warehouse holds on-hand inventory",
          entityType: "warehouse",
          entityId: item.warehouseId,
        });
        break;
      }
    }

    if (context.warehouses.length > 0 && defaultWarehouses.length === 0) {
      issues.push({
        code: PHASE3_READINESS_CODES.WAREHOUSE_INTEGRITY_VIOLATION,
        message: "Store has warehouses but no default warehouse configured",
        entityType: "warehouse",
      });
    }

    return issues;
  }

  private computeOverallStatus(
    context: OperationsContext,
    validation: IntegrityCheckResult,
  ): ReadinessStatus {
    if (!validation.valid) {
      return "FAILED";
    }

    const inventorySummary =
      this.operationsReadService.buildInventoryHealthSummary(context);
    const procurementDashboard =
      this.operationsReadService.buildProcurementDashboard(context);

    const warningCount =
      inventorySummary.lowStockItemCount +
      inventorySummary.openCycleCountCount +
      procurementDashboard.pendingRecommendationCount +
      procurementDashboard.draftPurchaseOrderCount +
      context.returns.filter(
        (record) =>
          record.status !== "completed" && record.status !== "rejected",
      ).length;

    return warningCount > 0 ? "WARNING" : "READY";
  }

  private filterIssues(
    issues: readonly IntegrityIssue[],
    codes: Set<string>,
    extraPredicate?: (issue: IntegrityIssue) => boolean,
  ): IntegrityIssue[] {
    return issues.filter(
      (issue) => codes.has(issue.code) || (extraPredicate?.(issue) ?? false),
    );
  }

  private deriveSectionStatus(
    issues: readonly IntegrityIssue[],
    warningCount: number,
  ): ReadinessStatus {
    if (issues.length > 0) {
      return "FAILED";
    }

    return warningCount > 0 ? "WARNING" : "READY";
  }

  private deriveOverallStatus(
    sectionStatuses: readonly ReadinessStatus[],
    validationStatus: ReadinessStatus,
  ): ReadinessStatus {
    if (
      validationStatus === "FAILED" ||
      sectionStatuses.some((status) => status === "FAILED")
    ) {
      return "FAILED";
    }

    if (
      validationStatus === "WARNING" ||
      sectionStatuses.some((status) => status === "WARNING")
    ) {
      return "WARNING";
    }

    return "READY";
  }
}

export const phase3ReadinessService = new Phase3ReadinessService();
