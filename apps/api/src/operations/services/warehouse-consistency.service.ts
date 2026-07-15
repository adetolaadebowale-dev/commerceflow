import type { IntegrityCheckResult, IntegrityIssue } from "@commerceflow/types";

import { PickListStatusTransitionPolicy } from "@/pick-lists/policies/pick-list-status-transition.policy";
import type { OperationsContext } from "../providers/operations-context";
import {
  OPERATIONS_INTEGRITY_CODES,
  buildIntegrityResult,
} from "./operations-utils";

export class WarehouseConsistencyService {
  validate(context: OperationsContext): IntegrityCheckResult {
    const issues: IntegrityIssue[] = [
      ...this.validateShipmentPickConsistency(context),
      ...this.validateTransferFulfillmentConflict(context),
    ];

    return buildIntegrityResult(issues);
  }

  private validateShipmentPickConsistency(
    context: OperationsContext,
  ): IntegrityIssue[] {
    const issues: IntegrityIssue[] = [];
    const pickListsByShipmentId = new Map(
      context.pickLists.map((pickList) => [pickList.shipmentId, pickList]),
    );
    const allocationsByPickListItemId = new Map<string, typeof context.allocations>();

    for (const allocation of context.allocations) {
      const existing =
        allocationsByPickListItemId.get(allocation.pickListItemId) ?? [];
      allocationsByPickListItemId.set(allocation.pickListItemId, [
        ...existing,
        allocation,
      ]);
    }

    for (const shipment of context.shipments) {
      if (shipment.status === "cancelled" || shipment.status === "pending") {
        continue;
      }

      const pickList = pickListsByShipmentId.get(shipment.id);

      if (!pickList) {
        issues.push({
          code: OPERATIONS_INTEGRITY_CODES.SHIPMENT_PICK_STATE_MISMATCH,
          message:
            "Shipment progressed beyond pending without an associated pick list",
          entityType: "shipment",
          entityId: shipment.id,
        });
        continue;
      }

      if (
        (shipment.status === "packed" ||
          shipment.status === "shipped" ||
          shipment.status === "delivered") &&
        pickList.status !== "packed"
      ) {
        issues.push({
          code: OPERATIONS_INTEGRITY_CODES.SHIPMENT_PICK_STATE_MISMATCH,
          message: `Shipment status ${shipment.status} requires pick list status packed`,
          entityType: "shipment",
          entityId: shipment.id,
        });
      }

      if (
        shipment.status === "shipped" ||
        shipment.status === "delivered" ||
        shipment.fulfilledAt
      ) {
        for (const item of pickList.items) {
          const itemAllocations =
            allocationsByPickListItemId.get(item.id) ?? [];

          const incomplete = itemAllocations.some(
            (allocation) =>
              allocation.status !== "picked" &&
              allocation.status !== "fulfilled" &&
              allocation.status !== "shortage",
          );

          if (incomplete || itemAllocations.length === 0) {
            issues.push({
              code: OPERATIONS_INTEGRITY_CODES.SHIPMENT_ALLOCATION_INCOMPLETE,
              message:
                "Shipment progressed with incomplete or missing pick allocations",
              entityType: "shipment",
              entityId: shipment.id,
            });
            break;
          }
        }
      }
    }

    return issues;
  }

  private validateTransferFulfillmentConflict(
    context: OperationsContext,
  ): IntegrityIssue[] {
    const issues: IntegrityIssue[] = [];
    const activeTransfers = context.warehouseTransfers.filter(
      (transfer) =>
        transfer.status === "approved" || transfer.status === "in_transit",
    );

    if (activeTransfers.length === 0) {
      return issues;
    }

    const inventoryItemById = new Map(
      context.inventoryItems.map((item) => [item.id, item]),
    );
    const activePickLists = context.pickLists.filter((pickList) =>
      PickListStatusTransitionPolicy.isActive(pickList.status),
    );
    const activePickListItemIds = new Set(
      activePickLists.flatMap((pickList) => pickList.items.map((item) => item.id)),
    );

    const activeAllocationItemIds = new Set(
      context.allocations
        .filter(
          (allocation) =>
            activePickListItemIds.has(allocation.pickListItemId) &&
            allocation.status !== "fulfilled",
        )
        .map((allocation) => allocation.inventoryItemId),
    );

    for (const transfer of activeTransfers) {
      for (const item of transfer.items) {
        const inventoryItem = inventoryItemById.get(item.inventoryItemId);

        if (!inventoryItem) {
          continue;
        }

        if (
          inventoryItem.warehouseId === transfer.sourceWarehouseId &&
          activeAllocationItemIds.has(item.inventoryItemId)
        ) {
          issues.push({
            code: OPERATIONS_INTEGRITY_CODES.TRANSFER_FULFILLMENT_CONFLICT,
            message:
              "Active warehouse transfer conflicts with in-progress fulfillment allocations",
            entityType: "warehouse_transfer",
            entityId: transfer.id,
          });
          break;
        }
      }
    }

    return issues;
  }
}
