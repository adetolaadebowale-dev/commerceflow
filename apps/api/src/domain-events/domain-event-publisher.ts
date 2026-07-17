import type { DomainEvent } from "@commerceflow/types";

import type { DomainEventDispatcher } from "./dispatcher";
import {
  buildCartCreatedEvent,
  buildCartItemAddedEvent,
  buildCartItemRemovedEvent,
  buildCartItemUpdatedEvent,
  buildCheckoutCompletedEvent,
  buildCheckoutShippingSelectedEvent,
  buildCustomerAddressCreatedEvent,
  buildCustomerAddressUpdatedEvent,
  buildCustomerCreatedEvent,
  buildCustomerUpdatedEvent,
  buildInventoryReleasedEvent,
  buildInventoryReservedEvent,
  buildOrderCancelledEvent,
  buildOrderConfirmedEvent,
  buildOrderFulfilledEvent,
  buildPaymentAuthorizedEvent,
  buildPaymentCancelledEvent,
  buildPaymentCreatedEvent,
  buildPaymentFailedEvent,
  buildPaymentPaidEvent,
  buildInvoiceCreatedEvent,
  buildInvoiceIssuedEvent,
  buildInvoicePaidEvent,
  buildInvoiceVoidedEvent,
  buildRefundCancelledEvent,
  buildRefundCompletedEvent,
  buildRefundCreatedEvent,
  buildPromotionCreatedEvent,
  buildPromotionDeletedEvent,
  buildPromotionUpdatedEvent,
  buildPromotionAppliedEvent,
  buildPromotionRemovedEvent,
  buildTaxCreatedEvent,
  buildTaxUpdatedEvent,
  buildTaxActivatedEvent,
  buildTaxDeactivatedEvent,
  buildWarehouseCreatedEvent,
  buildWarehouseUpdatedEvent,
  buildWarehouseActivatedEvent,
  buildWarehouseDeactivatedEvent,
  buildWarehouseDeletedEvent,
  buildWarehouseTransferApprovedEvent,
  buildWarehouseTransferCancelledEvent,
  buildWarehouseTransferCreatedEvent,
  buildWarehouseTransferReceivedEvent,
  buildWarehouseTransferShippedEvent,
  buildPurchaseOrderApprovedEvent,
  buildPurchaseOrderCancelledEvent,
  buildPurchaseOrderCreatedEvent,
  buildPurchaseOrderOrderedEvent,
  buildPurchaseOrderReceivedEvent,
  buildSupplierCreatedEvent,
  buildSupplierUpdatedEvent,
  buildSupplierDeletedEvent,
  buildSupplierContactCreatedEvent,
  buildSupplierContactUpdatedEvent,
  buildSupplierContactDeletedEvent,
  buildReplenishmentRuleCreatedEvent,
  buildReplenishmentRuleUpdatedEvent,
  buildReplenishmentRuleDeletedEvent,
  buildReplenishmentRecommendationGeneratedEvent,
  buildReplenishmentRecommendationAcceptedEvent,
  buildReplenishmentRecommendationDismissedEvent,
  buildOperationsIntegrityCheckedEvent,
  buildOperationsPhase3ValidationCompletedEvent,
  buildOperationsReadinessGeneratedEvent,
  buildReportsGeneratedEvent,
  buildDashboardViewedEvent,
  buildSalesReportGeneratedEvent,
  buildInventoryReportGeneratedEvent,
  buildCustomerReportGeneratedEvent,
  buildFinancialReportGeneratedEvent,
  buildProcurementReportGeneratedEvent,
  buildDashboardReportGeneratedEvent,
  buildWarehouseIntegrityCheckedEvent,
  buildInventoryIntegrityCheckedEvent,
  buildShipmentCreatedEvent,
  buildShipmentShippedEvent,
  buildShipmentDeliveredEvent,
  buildShipmentCancelledEvent,
  buildShipmentTrackingUpdatedEvent,
  buildShipmentPackageCreatedEvent,
  buildShipmentPackageUpdatedEvent,
  buildShipmentPackageDeletedEvent,
  buildPickListCreatedEvent,
  buildPickListStartedEvent,
  buildPickListCompletedEvent,
  buildPickListPackedEvent,
  buildInventoryAllocatedEvent,
  buildInventoryPartiallyPickedEvent,
  buildInventoryPickedEvent,
  buildInventoryShortageReportedEvent,
  buildInventoryFulfilledEvent,
  buildStockMovementCreatedEvent,
  buildReturnCreatedEvent,
  buildReturnReceivedEvent,
  buildReturnInspectedEvent,
  buildReturnCompletedEvent,
  buildInventoryAdjustedEvent,
  buildCycleCountCreatedEvent,
  buildCycleCountStartedEvent,
  buildCycleCountCompletedEvent,
  buildCycleCountApprovedEvent,
  buildShippingZoneCreatedEvent,
  buildShippingZoneUpdatedEvent,
  buildShippingZoneDeletedEvent,
  buildShippingMethodCreatedEvent,
  buildShippingMethodUpdatedEvent,
  buildShippingMethodDeletedEvent,
  buildNotificationCreatedEvent,
  buildNotificationSentEvent,
  buildNotificationFailedEvent,
  buildEmailSentEvent,
  buildEmailFailedEvent,
  buildSmsSentEvent,
  buildSmsFailedEvent,
  buildInAppNotificationReadEvent,
  buildInAppNotificationUnreadEvent,
  buildJobCreatedEvent,
  buildJobStartedEvent,
  buildJobCompletedEvent,
  buildJobFailedEvent,
  buildNotificationPreferenceUpdatedEvent,
} from "./domain-event-factory";
import type {
  Cart,
  CartItem,
  CheckoutResult,
  Customer,
  CustomerAddress,
  InventoryReservation,
  Order,
  OrderShippingMethodSnapshot,
  OrderFulfillmentResult,
  OrderStatus,
  Payment,
  PaymentStatus,
  Invoice,
  InvoiceStatus,
  Refund,
  RefundStatus,
  Promotion,
  AppliedCartPromotion,
  TaxRate,
  TaxRateStatus,
  Notification,
  NotificationPreference,
  Job,
  EmailMessage,
  EmailSendResult,
  SmsMessage,
  SmsSendResult,
  Warehouse,
  WarehouseStatus,
  Shipment,
  ShipmentStatus,
  ShipmentTrackingEvent,
  ShipmentPackage,
  PickList,
  InventoryAllocation,
  InventoryAllocationStatus,
  ShipmentFulfillmentResult,
  StockMovement,
  Return,
  ReturnCompletionResult,
  InventoryAdjustmentResult,
  CycleCount,
  CycleCountApprovalResult,
  WarehouseTransfer,
  WarehouseTransferReceiveResult,
  WarehouseTransferShipResult,
  PurchaseOrder,
  PurchaseOrderReceiveResult,
  Supplier,
  SupplierContact,
  ReplenishmentRule,
  ReplenishmentRecommendation,
  AcceptReplenishmentRecommendationResult,
  IntegrityCheckResult,
  Phase3ReadinessReport,
  Phase3ValidationResult,
  ReportDashboardResponse,
  SalesOrdersReport,
  SalesReportKind,
  SalesSummary,
  SalesTimelineReport,
  InventoryMovementReport,
  InventoryReportKind,
  InventorySummary,
  InventoryValuationReport,
  LowStockReport,
  CustomerGrowthReport,
  CustomerOrdersReport,
  CustomerReportKind,
  CustomerSummary,
  TopCustomersReport,
  FinancialSummary,
  InvoiceReport,
  PaymentReport,
  RefundReport,
  RevenueTimelineReport,
  FinancialReportKind,
  ProcurementSummary,
  PurchaseOrderAnalytics,
  ReplenishmentAnalytics,
  SupplierAnalytics,
  WarehouseAnalytics,
  ProcurementReportKind,
  DashboardKPIReport,
  DashboardReportKind,
  ExecutiveDashboard,
  ShippingZone,
  ShippingMethod,
} from "@commerceflow/types";

export interface DomainEventPublisherDependencies {
  readonly dispatcher?: DomainEventDispatcher;
  readonly onDispatchFailure?: (error: unknown, event: DomainEvent) => void;
}

export class DomainEventPublisher {
  private readonly dispatcher: DomainEventDispatcher;
  private readonly onDispatchFailure: (
    error: unknown,
    event: DomainEvent,
  ) => void;

  constructor(dependencies: DomainEventPublisherDependencies) {
    if (!dependencies.dispatcher) {
      throw new Error("DomainEventPublisher requires a dispatcher");
    }

    this.dispatcher = dependencies.dispatcher;
    this.onDispatchFailure =
      dependencies.onDispatchFailure ??
      ((error, event) => {
        console.error("Domain event dispatch failed", {
          error,
          eventType: event.eventType,
          eventId: event.id,
        });
      });
  }

  publishOrderConfirmed(order: Order, previousStatus: OrderStatus): void {
    this.dispatch(buildOrderConfirmedEvent(order, previousStatus));
  }

  publishOrderCancelled(order: Order, previousStatus: OrderStatus): void {
    this.dispatch(buildOrderCancelledEvent(order, previousStatus));
  }

  publishOrderFulfilled(result: OrderFulfillmentResult): void {
    this.dispatch(buildOrderFulfilledEvent(result));
  }

  publishInventoryReserved(
    orderId: string,
    storeId: string,
    reservations: readonly InventoryReservation[],
  ): void {
    this.dispatch(
      buildInventoryReservedEvent(orderId, storeId, reservations),
    );
  }

  publishInventoryReleased(reservation: InventoryReservation): void {
    this.dispatch(buildInventoryReleasedEvent(reservation));
  }

  publishCustomerCreated(customer: Customer): void {
    this.dispatch(buildCustomerCreatedEvent(customer));
  }

  publishCustomerUpdated(customer: Customer): void {
    this.dispatch(buildCustomerUpdatedEvent(customer));
  }

  publishCustomerAddressCreated(customerAddress: CustomerAddress): void {
    this.dispatch(buildCustomerAddressCreatedEvent(customerAddress));
  }

  publishCustomerAddressUpdated(customerAddress: CustomerAddress): void {
    this.dispatch(buildCustomerAddressUpdatedEvent(customerAddress));
  }

  publishCartCreated(cart: Cart): void {
    this.dispatch(buildCartCreatedEvent(cart));
  }

  publishCartItemAdded(cart: Cart, cartItem: CartItem): void {
    this.dispatch(buildCartItemAddedEvent(cart, cartItem));
  }

  publishCartItemUpdated(cart: Cart, cartItem: CartItem): void {
    this.dispatch(buildCartItemUpdatedEvent(cart, cartItem));
  }

  publishCartItemRemoved(
    cart: Cart,
    cartItemId: string,
    productVariantId: string,
  ): void {
    this.dispatch(buildCartItemRemovedEvent(cart, cartItemId, productVariantId));
  }

  publishCheckoutCompleted(
    result: CheckoutResult,
    customerAddressId: string,
  ): void {
    this.dispatch(buildCheckoutCompletedEvent(result, customerAddressId));
  }

  publishCheckoutShippingSelected(
    order: Order,
    appliedShippingMethod: OrderShippingMethodSnapshot,
    shippingAmount: string,
  ): void {
    this.dispatch(
      buildCheckoutShippingSelectedEvent(order, appliedShippingMethod, shippingAmount),
    );
  }

  publishPaymentCreated(payment: Payment): void {
    this.dispatch(buildPaymentCreatedEvent(payment));
  }

  publishPaymentAuthorized(
    payment: Payment,
    previousStatus: PaymentStatus,
  ): void {
    this.dispatch(buildPaymentAuthorizedEvent(payment, previousStatus));
  }

  publishPaymentPaid(payment: Payment, previousStatus: PaymentStatus): void {
    this.dispatch(buildPaymentPaidEvent(payment, previousStatus));
  }

  publishPaymentFailed(payment: Payment, previousStatus: PaymentStatus): void {
    this.dispatch(buildPaymentFailedEvent(payment, previousStatus));
  }

  publishPaymentCancelled(
    payment: Payment,
    previousStatus: PaymentStatus,
  ): void {
    this.dispatch(buildPaymentCancelledEvent(payment, previousStatus));
  }

  publishInvoiceCreated(invoice: Invoice): void {
    this.dispatch(buildInvoiceCreatedEvent(invoice));
  }

  publishInvoiceIssued(
    invoice: Invoice,
    previousStatus: InvoiceStatus,
  ): void {
    this.dispatch(buildInvoiceIssuedEvent(invoice, previousStatus));
  }

  publishInvoicePaid(invoice: Invoice, previousStatus: InvoiceStatus): void {
    this.dispatch(buildInvoicePaidEvent(invoice, previousStatus));
  }

  publishInvoiceVoided(
    invoice: Invoice,
    previousStatus: InvoiceStatus,
  ): void {
    this.dispatch(buildInvoiceVoidedEvent(invoice, previousStatus));
  }

  publishRefundCreated(refund: Refund): void {
    this.dispatch(buildRefundCreatedEvent(refund));
  }

  publishRefundCompleted(
    refund: Refund,
    previousStatus: RefundStatus,
  ): void {
    this.dispatch(buildRefundCompletedEvent(refund, previousStatus));
  }

  publishRefundCancelled(
    refund: Refund,
    previousStatus: RefundStatus,
  ): void {
    this.dispatch(buildRefundCancelledEvent(refund, previousStatus));
  }

  publishPromotionCreated(promotion: Promotion): void {
    this.dispatch(buildPromotionCreatedEvent(promotion));
  }

  publishPromotionUpdated(promotion: Promotion): void {
    this.dispatch(buildPromotionUpdatedEvent(promotion));
  }

  publishPromotionDeleted(promotion: Promotion): void {
    this.dispatch(buildPromotionDeletedEvent(promotion));
  }

  publishPromotionApplied(cart: Cart, applied: AppliedCartPromotion): void {
    this.dispatch(buildPromotionAppliedEvent(cart, applied));
  }

  publishPromotionRemoved(cart: Cart, applied: AppliedCartPromotion): void {
    this.dispatch(buildPromotionRemovedEvent(cart, applied));
  }

  publishTaxCreated(taxRate: TaxRate): void {
    this.dispatch(buildTaxCreatedEvent(taxRate));
  }

  publishTaxUpdated(taxRate: TaxRate): void {
    this.dispatch(buildTaxUpdatedEvent(taxRate));
  }

  publishTaxActivated(
    taxRate: TaxRate,
    previousStatus: TaxRateStatus,
  ): void {
    this.dispatch(buildTaxActivatedEvent(taxRate, previousStatus));
  }

  publishTaxDeactivated(
    taxRate: TaxRate,
    previousStatus: TaxRateStatus,
  ): void {
    this.dispatch(buildTaxDeactivatedEvent(taxRate, previousStatus));
  }

  publishNotificationCreated(notification: Notification): void {
    this.dispatch(buildNotificationCreatedEvent(notification));
  }

  publishNotificationSent(notification: Notification): void {
    this.dispatch(buildNotificationSentEvent(notification));
  }

  publishNotificationFailed(
    notification: Notification,
    message?: string,
  ): void {
    this.dispatch(buildNotificationFailedEvent(notification, message));
  }

  publishEmailSent(message: EmailMessage, result: EmailSendResult): void {
    this.dispatch(buildEmailSentEvent(message, result));
  }

  publishEmailFailed(message: EmailMessage, result: EmailSendResult): void {
    this.dispatch(buildEmailFailedEvent(message, result));
  }

  publishSmsSent(message: SmsMessage, result: SmsSendResult): void {
    this.dispatch(buildSmsSentEvent(message, result));
  }

  publishSmsFailed(message: SmsMessage, result: SmsSendResult): void {
    this.dispatch(buildSmsFailedEvent(message, result));
  }

  publishInAppNotificationRead(notification: Notification): void {
    this.dispatch(buildInAppNotificationReadEvent(notification));
  }

  publishInAppNotificationUnread(notification: Notification): void {
    this.dispatch(buildInAppNotificationUnreadEvent(notification));
  }

  publishJobCreated(job: Job): void {
    this.dispatch(buildJobCreatedEvent(job));
  }

  publishJobStarted(job: Job): void {
    this.dispatch(buildJobStartedEvent(job));
  }

  publishJobCompleted(job: Job): void {
    this.dispatch(buildJobCompletedEvent(job));
  }

  publishJobFailed(job: Job): void {
    this.dispatch(buildJobFailedEvent(job));
  }

  publishNotificationPreferenceUpdated(
    preference: NotificationPreference,
  ): void {
    this.dispatch(buildNotificationPreferenceUpdatedEvent(preference));
  }

  publishWarehouseCreated(warehouse: Warehouse): void {
    this.dispatch(buildWarehouseCreatedEvent(warehouse));
  }

  publishWarehouseUpdated(warehouse: Warehouse): void {
    this.dispatch(buildWarehouseUpdatedEvent(warehouse));
  }

  publishWarehouseActivated(
    warehouse: Warehouse,
    previousStatus: WarehouseStatus,
  ): void {
    this.dispatch(buildWarehouseActivatedEvent(warehouse, previousStatus));
  }

  publishWarehouseDeactivated(
    warehouse: Warehouse,
    previousStatus: WarehouseStatus,
  ): void {
    this.dispatch(buildWarehouseDeactivatedEvent(warehouse, previousStatus));
  }

  publishWarehouseDeleted(warehouse: Warehouse): void {
    this.dispatch(buildWarehouseDeletedEvent(warehouse));
  }

  publishShipmentCreated(shipment: Shipment): void {
    this.dispatch(buildShipmentCreatedEvent(shipment));
  }

  publishShipmentShipped(
    shipment: Shipment,
    previousStatus: ShipmentStatus,
  ): void {
    this.dispatch(buildShipmentShippedEvent(shipment, previousStatus));
  }

  publishShipmentDelivered(
    shipment: Shipment,
    previousStatus: ShipmentStatus,
  ): void {
    this.dispatch(buildShipmentDeliveredEvent(shipment, previousStatus));
  }

  publishShipmentCancelled(
    shipment: Shipment,
    previousStatus: ShipmentStatus,
  ): void {
    this.dispatch(buildShipmentCancelledEvent(shipment, previousStatus));
  }

  publishShipmentTrackingUpdated(
    shipment: Shipment,
    trackingEvent: ShipmentTrackingEvent,
  ): void {
    this.dispatch(buildShipmentTrackingUpdatedEvent(shipment, trackingEvent));
  }

  publishShipmentPackageCreated(
    shipment: Shipment,
    shipmentPackage: ShipmentPackage,
  ): void {
    this.dispatch(
      buildShipmentPackageCreatedEvent(shipment, shipmentPackage),
    );
  }

  publishShipmentPackageUpdated(
    shipment: Shipment,
    shipmentPackage: ShipmentPackage,
  ): void {
    this.dispatch(
      buildShipmentPackageUpdatedEvent(shipment, shipmentPackage),
    );
  }

  publishShipmentPackageDeleted(
    shipment: Shipment,
    shipmentPackage: ShipmentPackage,
  ): void {
    this.dispatch(
      buildShipmentPackageDeletedEvent(shipment, shipmentPackage),
    );
  }

  publishPickListCreated(pickList: PickList): void {
    this.dispatch(buildPickListCreatedEvent(pickList));
  }

  publishPickListStarted(
    pickList: PickList,
    previousStatus: "pending",
  ): void {
    this.dispatch(buildPickListStartedEvent(pickList, previousStatus));
  }

  publishPickListCompleted(
    pickList: PickList,
    previousStatus: "picking",
  ): void {
    this.dispatch(buildPickListCompletedEvent(pickList, previousStatus));
  }

  publishPickListPacked(
    pickList: PickList,
    previousStatus: "picked",
  ): void {
    this.dispatch(buildPickListPackedEvent(pickList, previousStatus));
  }

  publishInventoryAllocated(allocation: InventoryAllocation): void {
    this.dispatch(buildInventoryAllocatedEvent(allocation));
  }

  publishInventoryPartiallyPicked(
    allocation: InventoryAllocation,
    previousStatus: InventoryAllocationStatus,
  ): void {
    this.dispatch(
      buildInventoryPartiallyPickedEvent(allocation, previousStatus),
    );
  }

  publishInventoryPicked(
    allocation: InventoryAllocation,
    previousStatus: InventoryAllocationStatus,
  ): void {
    this.dispatch(buildInventoryPickedEvent(allocation, previousStatus));
  }

  publishInventoryShortageReported(
    allocation: InventoryAllocation,
    previousStatus: InventoryAllocationStatus,
  ): void {
    this.dispatch(
      buildInventoryShortageReportedEvent(allocation, previousStatus),
    );
  }

  publishInventoryFulfilled(result: ShipmentFulfillmentResult): void {
    this.dispatch(buildInventoryFulfilledEvent(result));
  }

  publishStockMovementCreated(stockMovement: StockMovement): void {
    this.dispatch(buildStockMovementCreatedEvent(stockMovement));
  }

  publishReturnCreated(returnRecord: Return): void {
    this.dispatch(buildReturnCreatedEvent(returnRecord));
  }

  publishReturnReceived(returnRecord: Return): void {
    this.dispatch(buildReturnReceivedEvent(returnRecord));
  }

  publishReturnInspected(returnRecord: Return): void {
    this.dispatch(buildReturnInspectedEvent(returnRecord));
  }

  publishReturnCompleted(result: ReturnCompletionResult): void {
    this.dispatch(buildReturnCompletedEvent(result));
  }

  publishInventoryAdjusted(result: InventoryAdjustmentResult): void {
    this.dispatch(buildInventoryAdjustedEvent(result));
  }

  publishCycleCountCreated(cycleCount: CycleCount): void {
    this.dispatch(buildCycleCountCreatedEvent(cycleCount));
  }

  publishCycleCountStarted(cycleCount: CycleCount): void {
    this.dispatch(buildCycleCountStartedEvent(cycleCount));
  }

  publishCycleCountCompleted(cycleCount: CycleCount): void {
    this.dispatch(buildCycleCountCompletedEvent(cycleCount));
  }

  publishCycleCountApproved(result: CycleCountApprovalResult): void {
    this.dispatch(buildCycleCountApprovedEvent(result));
  }

  publishWarehouseTransferCreated(warehouseTransfer: WarehouseTransfer): void {
    this.dispatch(buildWarehouseTransferCreatedEvent(warehouseTransfer));
  }

  publishWarehouseTransferApproved(warehouseTransfer: WarehouseTransfer): void {
    this.dispatch(buildWarehouseTransferApprovedEvent(warehouseTransfer));
  }

  publishWarehouseTransferShipped(result: WarehouseTransferShipResult): void {
    this.dispatch(buildWarehouseTransferShippedEvent(result));
    for (const stockMovement of result.stockMovements) {
      this.publishStockMovementCreated(stockMovement);
    }
  }

  publishWarehouseTransferReceived(
    result: WarehouseTransferReceiveResult,
  ): void {
    this.dispatch(buildWarehouseTransferReceivedEvent(result));
    for (const stockMovement of result.stockMovements) {
      this.publishStockMovementCreated(stockMovement);
    }
  }

  publishWarehouseTransferCancelled(
    warehouseTransfer: WarehouseTransfer,
    previousStatus: WarehouseTransfer["status"],
  ): void {
    this.dispatch(
      buildWarehouseTransferCancelledEvent(warehouseTransfer, previousStatus),
    );
  }

  publishPurchaseOrderCreated(purchaseOrder: PurchaseOrder): void {
    this.dispatch(buildPurchaseOrderCreatedEvent(purchaseOrder));
  }

  publishPurchaseOrderApproved(purchaseOrder: PurchaseOrder): void {
    this.dispatch(buildPurchaseOrderApprovedEvent(purchaseOrder));
  }

  publishPurchaseOrderOrdered(purchaseOrder: PurchaseOrder): void {
    this.dispatch(buildPurchaseOrderOrderedEvent(purchaseOrder));
  }

  publishPurchaseOrderReceived(
    result: PurchaseOrderReceiveResult,
    previousStatus: PurchaseOrder["status"],
  ): void {
    this.dispatch(buildPurchaseOrderReceivedEvent(result, previousStatus));
    for (const stockMovement of result.stockMovements) {
      this.publishStockMovementCreated(stockMovement);
    }
  }

  publishPurchaseOrderCancelled(
    purchaseOrder: PurchaseOrder,
    previousStatus: PurchaseOrder["status"],
  ): void {
    this.dispatch(
      buildPurchaseOrderCancelledEvent(purchaseOrder, previousStatus),
    );
  }

  publishSupplierCreated(supplier: Supplier): void {
    this.dispatch(buildSupplierCreatedEvent(supplier));
  }

  publishSupplierUpdated(supplier: Supplier): void {
    this.dispatch(buildSupplierUpdatedEvent(supplier));
  }

  publishSupplierDeleted(supplier: Supplier): void {
    this.dispatch(buildSupplierDeletedEvent(supplier));
  }

  publishSupplierContactCreated(
    contact: SupplierContact,
    storeId: string,
  ): void {
    this.dispatch(buildSupplierContactCreatedEvent(contact, storeId));
  }

  publishSupplierContactUpdated(
    contact: SupplierContact,
    storeId: string,
  ): void {
    this.dispatch(buildSupplierContactUpdatedEvent(contact, storeId));
  }

  publishSupplierContactDeleted(
    contact: SupplierContact,
    storeId: string,
  ): void {
    this.dispatch(buildSupplierContactDeletedEvent(contact, storeId));
  }

  publishReplenishmentRuleCreated(rule: ReplenishmentRule): void {
    this.dispatch(buildReplenishmentRuleCreatedEvent(rule));
  }

  publishReplenishmentRuleUpdated(rule: ReplenishmentRule): void {
    this.dispatch(buildReplenishmentRuleUpdatedEvent(rule));
  }

  publishReplenishmentRuleDeleted(rule: ReplenishmentRule): void {
    this.dispatch(buildReplenishmentRuleDeletedEvent(rule));
  }

  publishReplenishmentRecommendationGenerated(
    recommendation: ReplenishmentRecommendation,
  ): void {
    this.dispatch(
      buildReplenishmentRecommendationGeneratedEvent(recommendation),
    );
  }

  publishReplenishmentRecommendationAccepted(
    result: AcceptReplenishmentRecommendationResult,
  ): void {
    this.dispatch(buildReplenishmentRecommendationAcceptedEvent(result));
  }

  publishReplenishmentRecommendationDismissed(
    recommendation: ReplenishmentRecommendation,
  ): void {
    this.dispatch(
      buildReplenishmentRecommendationDismissedEvent(recommendation),
    );
  }

  publishOperationsIntegrityChecked(
    storeId: string,
    result: IntegrityCheckResult,
  ): void {
    this.dispatch(buildOperationsIntegrityCheckedEvent(storeId, result));
  }

  publishWarehouseIntegrityChecked(
    storeId: string,
    result: IntegrityCheckResult,
  ): void {
    this.dispatch(buildWarehouseIntegrityCheckedEvent(storeId, result));
  }

  publishInventoryIntegrityChecked(
    storeId: string,
    result: IntegrityCheckResult,
  ): void {
    this.dispatch(buildInventoryIntegrityCheckedEvent(storeId, result));
  }

  publishOperationsPhase3ValidationCompleted(
    storeId: string,
    result: Phase3ValidationResult,
  ): void {
    this.dispatch(buildOperationsPhase3ValidationCompletedEvent(storeId, result));
  }

  publishOperationsReadinessGenerated(
    storeId: string,
    report: Phase3ReadinessReport,
  ): void {
    this.dispatch(buildOperationsReadinessGeneratedEvent(storeId, report));
  }

  publishReportsGenerated(
    storeId: string,
    report: ReportDashboardResponse,
  ): void {
    this.dispatch(buildReportsGeneratedEvent(storeId, report));
  }

  publishDashboardViewed(
    storeId: string,
    report: ReportDashboardResponse,
  ): void {
    this.dispatch(buildDashboardViewedEvent(storeId, report));
  }

  publishSalesReportGenerated(
    storeId: string,
    reportKind: SalesReportKind,
    orderCount: number,
    report: SalesSummary | SalesTimelineReport | SalesOrdersReport,
  ): void {
    this.dispatch(
      buildSalesReportGeneratedEvent(storeId, reportKind, orderCount, report),
    );
  }

  publishInventoryReportGenerated(
    storeId: string,
    reportKind: InventoryReportKind,
    rowCount: number,
    report:
      | InventorySummary
      | InventoryMovementReport
      | LowStockReport
      | InventoryValuationReport,
  ): void {
    this.dispatch(
      buildInventoryReportGeneratedEvent(storeId, reportKind, rowCount, report),
    );
  }

  publishCustomerReportGenerated(
    storeId: string,
    reportKind: CustomerReportKind,
    rowCount: number,
    report:
      | CustomerSummary
      | CustomerGrowthReport
      | TopCustomersReport
      | CustomerOrdersReport,
  ): void {
    this.dispatch(
      buildCustomerReportGeneratedEvent(storeId, reportKind, rowCount, report),
    );
  }

  publishFinancialReportGenerated(
    storeId: string,
    reportKind: FinancialReportKind,
    rowCount: number,
    report:
      | FinancialSummary
      | RevenueTimelineReport
      | PaymentReport
      | InvoiceReport
      | RefundReport,
  ): void {
    this.dispatch(
      buildFinancialReportGeneratedEvent(storeId, reportKind, rowCount, report),
    );
  }

  publishProcurementReportGenerated(
    storeId: string,
    reportKind: ProcurementReportKind,
    rowCount: number,
    report:
      | ProcurementSummary
      | PurchaseOrderAnalytics
      | SupplierAnalytics
      | WarehouseAnalytics
      | ReplenishmentAnalytics,
  ): void {
    this.dispatch(
      buildProcurementReportGeneratedEvent(storeId, reportKind, rowCount, report),
    );
  }

  publishDashboardReportGenerated(
    storeId: string,
    reportKind: DashboardReportKind,
    rowCount: number,
    report: ExecutiveDashboard | DashboardKPIReport,
  ): void {
    this.dispatch(
      buildDashboardReportGeneratedEvent(storeId, reportKind, rowCount, report),
    );
  }

  publishShippingZoneCreated(shippingZone: ShippingZone): void {
    this.dispatch(buildShippingZoneCreatedEvent(shippingZone));
  }

  publishShippingZoneUpdated(shippingZone: ShippingZone): void {
    this.dispatch(buildShippingZoneUpdatedEvent(shippingZone));
  }

  publishShippingZoneDeleted(shippingZone: ShippingZone): void {
    this.dispatch(buildShippingZoneDeletedEvent(shippingZone));
  }

  publishShippingMethodCreated(shippingMethod: ShippingMethod): void {
    this.dispatch(buildShippingMethodCreatedEvent(shippingMethod));
  }

  publishShippingMethodUpdated(shippingMethod: ShippingMethod): void {
    this.dispatch(buildShippingMethodUpdatedEvent(shippingMethod));
  }

  publishShippingMethodDeleted(shippingMethod: ShippingMethod): void {
    this.dispatch(buildShippingMethodDeletedEvent(shippingMethod));
  }

  private dispatch(event: DomainEvent): void {
    void this.dispatcher.publish(event).catch((error) => {
      this.onDispatchFailure(error, event);
    });
  }
}
