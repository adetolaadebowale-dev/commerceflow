import type {
  DomainEvent,
  DomainAggregateType,
  DomainEventType,
  InventoryReleasedPayload,
  InventoryReservedPayload,
  InventoryReservation,
  Customer,
  CustomerAddress,
  CustomerAddressCreatedPayload,
  CustomerAddressUpdatedPayload,
  CustomerCreatedPayload,
  CustomerUpdatedPayload,
  Cart,
  CartCreatedPayload,
  CartItem,
  CartItemAddedPayload,
  CartItemRemovedPayload,
  CartItemUpdatedPayload,
  CheckoutCompletedPayload,
  CheckoutShippingSelectedPayload,
  CheckoutResult,
  Order,
  OrderShippingMethodSnapshot,
  OrderCancelledPayload,
  OrderConfirmedPayload,
  OrderFulfilledPayload,
  OrderFulfillmentResult,
  OrderStatus,
  Payment,
  PaymentAuthorizedPayload,
  PaymentCancelledPayload,
  PaymentCreatedPayload,
  PaymentFailedPayload,
  PaymentPaidPayload,
  PaymentStatus,
  Invoice,
  InvoiceCreatedPayload,
  InvoiceIssuedPayload,
  InvoicePaidPayload,
  InvoiceStatus,
  InvoiceVoidedPayload,
  Refund,
  RefundCancelledPayload,
  RefundCompletedPayload,
  RefundCreatedPayload,
  RefundStatus,
  Promotion,
  PromotionCreatedPayload,
  PromotionDeletedPayload,
  PromotionUpdatedPayload,
  PromotionAppliedPayload,
  PromotionRemovedPayload,
  AppliedCartPromotion,
  TaxRate,
  TaxRateStatus,
  TaxCreatedPayload,
  TaxUpdatedPayload,
  TaxActivatedPayload,
  TaxDeactivatedPayload,
  Warehouse,
  WarehouseStatus,
  WarehouseCreatedPayload,
  WarehouseUpdatedPayload,
  WarehouseActivatedPayload,
  WarehouseDeactivatedPayload,
  WarehouseDeletedPayload,
  WarehouseTransfer,
  WarehouseTransferApprovedPayload,
  WarehouseTransferCancelledPayload,
  WarehouseTransferCreatedPayload,
  WarehouseTransferReceiveResult,
  WarehouseTransferReceivedPayload,
  WarehouseTransferShipResult,
  WarehouseTransferShippedPayload,
  PurchaseOrder,
  PurchaseOrderApprovedPayload,
  PurchaseOrderCancelledPayload,
  PurchaseOrderCreatedPayload,
  PurchaseOrderOrderedPayload,
  PurchaseOrderReceiveResult,
  PurchaseOrderReceivedPayload,
  Supplier,
  SupplierContact,
  SupplierContactCreatedPayload,
  SupplierContactDeletedPayload,
  SupplierContactUpdatedPayload,
  SupplierCreatedPayload,
  SupplierDeletedPayload,
  SupplierUpdatedPayload,
  ReplenishmentRule,
  ReplenishmentRecommendation,
  ReplenishmentRuleCreatedPayload,
  ReplenishmentRuleUpdatedPayload,
  ReplenishmentRuleDeletedPayload,
  ReplenishmentRecommendationGeneratedPayload,
  ReplenishmentRecommendationAcceptedPayload,
  ReplenishmentRecommendationDismissedPayload,
  AcceptReplenishmentRecommendationResult,
  IntegrityCheckResult,
  OperationsIntegrityCheckedPayload,
  WarehouseIntegrityCheckedPayload,
  InventoryIntegrityCheckedPayload,
  OperationsPhase3ValidationCompletedPayload,
  OperationsReadinessGeneratedPayload,
  ReportsGeneratedPayload,
  DashboardViewedPayload,
  Phase3ReadinessReport,
  Phase3ValidationResult,
  ReportDashboardResponse,
  InventoryReportGeneratedPayload,
  InventoryReportKind,
  SalesOrdersReport,
  SalesReportGeneratedPayload,
  SalesReportKind,
  SalesSummary,
  SalesTimelineReport,
  InventoryMovementReport,
  InventorySummary,
  InventoryValuationReport,
  LowStockReport,
  CustomerGrowthReport,
  CustomerOrdersReport,
  CustomerReportGeneratedPayload,
  CustomerReportKind,
  CustomerSummary,
  TopCustomersReport,
  FinancialReportGeneratedPayload,
  FinancialReportKind,
  FinancialSummary,
  InvoiceReport,
  PaymentReport,
  ProcurementReportGeneratedPayload,
  ProcurementReportKind,
  ProcurementSummary,
  PurchaseOrderAnalytics,
  ReplenishmentAnalytics,
  SupplierAnalytics,
  WarehouseAnalytics,
  DashboardKPIReport,
  DashboardReportGeneratedPayload,
  DashboardReportKind,
  ExecutiveDashboard,
  RefundReport,
  RevenueTimelineReport,
  Shipment,
  ShipmentStatus,
  ShipmentCreatedPayload,
  ShipmentShippedPayload,
  ShipmentDeliveredPayload,
  ShipmentCancelledPayload,
  ShipmentTrackingEvent,
  ShipmentTrackingUpdatedPayload,
  ShipmentPackage,
  ShipmentPackageCreatedPayload,
  ShipmentPackageUpdatedPayload,
  ShipmentPackageDeletedPayload,
  PickList,
  PickListCreatedPayload,
  PickListStartedPayload,
  PickListCompletedPayload,
  PickListPackedPayload,
  InventoryAllocation,
  InventoryAllocationStatus,
  InventoryAllocatedPayload,
  InventoryPartiallyPickedPayload,
  InventoryPickedPayload,
  InventoryShortageReportedPayload,
  InventoryFulfilledPayload,
  ShipmentFulfillmentResult,
  StockMovement,
  StockMovementCreatedPayload,
  Return,
  ReturnCompletionResult,
  ReturnCreatedPayload,
  ReturnReceivedPayload,
  ReturnInspectedPayload,
  ReturnCompletedPayload,
  InventoryAdjustmentResult,
  InventoryAdjustedPayload,
  CycleCount,
  CycleCountApprovalResult,
  CycleCountCreatedPayload,
  CycleCountStartedPayload,
  CycleCountCompletedPayload,
  CycleCountApprovedPayload,
  ShippingZone,
  ShippingMethod,
  ShippingZoneCreatedPayload,
  ShippingZoneUpdatedPayload,
  ShippingZoneDeletedPayload,
  ShippingMethodCreatedPayload,
  ShippingMethodUpdatedPayload,
  ShippingMethodDeletedPayload,
} from "@commerceflow/types";

export function createDomainEvent<TPayload>(input: {
  readonly eventType: DomainEventType;
  readonly aggregateType: DomainAggregateType;
  readonly aggregateId: string;
  readonly storeId: string | null;
  readonly payload: TPayload;
}): DomainEvent<TPayload> {
  return {
    id: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
    eventType: input.eventType,
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    storeId: input.storeId,
    payload: input.payload,
  };
}

export function buildOrderConfirmedEvent(
  order: Order,
  previousStatus: OrderStatus,
): DomainEvent<OrderConfirmedPayload> {
  return createDomainEvent({
    eventType: "order.confirmed",
    aggregateType: "order",
    aggregateId: order.id,
    storeId: order.storeId,
    payload: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      previousStatus,
      status: "confirmed",
      confirmedAt: order.confirmedAt,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      total: order.total,
      currency: order.currency,
      itemCount: order.items.length,
    },
  });
}

export function buildOrderCancelledEvent(
  order: Order,
  previousStatus: OrderStatus,
): DomainEvent<OrderCancelledPayload> {
  return createDomainEvent({
    eventType: "order.cancelled",
    aggregateType: "order",
    aggregateId: order.id,
    storeId: order.storeId,
    payload: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      previousStatus,
      status: "cancelled",
      cancelledAt: order.cancelledAt,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      total: order.total,
      currency: order.currency,
      itemCount: order.items.length,
    },
  });
}

export function buildOrderFulfilledEvent(
  result: OrderFulfillmentResult,
): DomainEvent<OrderFulfilledPayload> {
  return createDomainEvent({
    eventType: "order.fulfilled",
    aggregateType: "order",
    aggregateId: result.order.id,
    storeId: result.order.storeId,
    payload: {
      orderId: result.order.id,
      orderNumber: result.order.orderNumber,
      status: "fulfilled",
      fulfilledAt: result.order.fulfilledAt,
      reservationCount: result.reservations.length,
      stockMovementCount: result.stockMovements.length,
      order: result.order,
      result,
    },
  });
}

export function buildInventoryReservedEvent(
  orderId: string,
  storeId: string,
  reservations: readonly InventoryReservation[],
): DomainEvent<InventoryReservedPayload> {
  return createDomainEvent({
    eventType: "inventory.reserved",
    aggregateType: "order",
    aggregateId: orderId,
    storeId,
    payload: {
      orderId,
      reservationCount: reservations.length,
      reservations,
    },
  });
}

export function buildInventoryReleasedEvent(
  reservation: InventoryReservation,
): DomainEvent<InventoryReleasedPayload> {
  return createDomainEvent({
    eventType: "inventory.released",
    aggregateType: "inventory_reservation",
    aggregateId: reservation.id,
    storeId: reservation.storeId,
    payload: {
      reservationId: reservation.id,
      orderId: reservation.orderId,
      orderItemId: reservation.orderItemId,
      inventoryItemId: reservation.inventoryItemId,
      reservedQuantity: reservation.reservedQuantity,
      releasedAt: reservation.releasedAt,
      reservation,
    },
  });
}

export function buildCustomerCreatedEvent(
  customer: Customer,
): DomainEvent<CustomerCreatedPayload> {
  return createDomainEvent({
    eventType: "customer.created",
    aggregateType: "customer",
    aggregateId: customer.id,
    storeId: customer.storeId,
    payload: {
      customerId: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      status: customer.status,
      customer,
    },
  });
}

export function buildCustomerUpdatedEvent(
  customer: Customer,
): DomainEvent<CustomerUpdatedPayload> {
  return createDomainEvent({
    eventType: "customer.updated",
    aggregateType: "customer",
    aggregateId: customer.id,
    storeId: customer.storeId,
    payload: {
      customerId: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      status: customer.status,
      customer,
    },
  });
}

export function buildCustomerAddressCreatedEvent(
  customerAddress: CustomerAddress,
): DomainEvent<CustomerAddressCreatedPayload> {
  return createDomainEvent({
    eventType: "customer.address.created",
    aggregateType: "customer_address",
    aggregateId: customerAddress.id,
    storeId: customerAddress.storeId,
    payload: {
      customerAddressId: customerAddress.id,
      customerId: customerAddress.customerId,
      label: customerAddress.label,
      isDefault: customerAddress.isDefault,
      customerAddress,
    },
  });
}

export function buildCustomerAddressUpdatedEvent(
  customerAddress: CustomerAddress,
): DomainEvent<CustomerAddressUpdatedPayload> {
  return createDomainEvent({
    eventType: "customer.address.updated",
    aggregateType: "customer_address",
    aggregateId: customerAddress.id,
    storeId: customerAddress.storeId,
    payload: {
      customerAddressId: customerAddress.id,
      customerId: customerAddress.customerId,
      label: customerAddress.label,
      isDefault: customerAddress.isDefault,
      customerAddress,
    },
  });
}

export function buildCartCreatedEvent(
  cart: Cart,
): DomainEvent<CartCreatedPayload> {
  return createDomainEvent({
    eventType: "cart.created",
    aggregateType: "cart",
    aggregateId: cart.id,
    storeId: cart.storeId,
    payload: {
      cartId: cart.id,
      customerId: cart.customerId,
      status: cart.status,
      cart,
    },
  });
}

export function buildCartItemAddedEvent(
  cart: Cart,
  cartItem: CartItem,
): DomainEvent<CartItemAddedPayload> {
  return createDomainEvent({
    eventType: "cart.item.added",
    aggregateType: "cart_item",
    aggregateId: cartItem.id,
    storeId: cart.storeId,
    payload: {
      cartId: cart.id,
      cartItemId: cartItem.id,
      productVariantId: cartItem.productVariantId,
      quantity: cartItem.quantity,
      cartItem,
      cart,
    },
  });
}

export function buildCartItemUpdatedEvent(
  cart: Cart,
  cartItem: CartItem,
): DomainEvent<CartItemUpdatedPayload> {
  return createDomainEvent({
    eventType: "cart.item.updated",
    aggregateType: "cart_item",
    aggregateId: cartItem.id,
    storeId: cart.storeId,
    payload: {
      cartId: cart.id,
      cartItemId: cartItem.id,
      productVariantId: cartItem.productVariantId,
      quantity: cartItem.quantity,
      cartItem,
      cart,
    },
  });
}

export function buildCartItemRemovedEvent(
  cart: Cart,
  cartItemId: string,
  productVariantId: string,
): DomainEvent<CartItemRemovedPayload> {
  return createDomainEvent({
    eventType: "cart.item.removed",
    aggregateType: "cart_item",
    aggregateId: cartItemId,
    storeId: cart.storeId,
    payload: {
      cartId: cart.id,
      cartItemId,
      productVariantId,
      cart,
    },
  });
}

export function buildCheckoutCompletedEvent(
  result: CheckoutResult,
  customerAddressId: string,
): DomainEvent<CheckoutCompletedPayload> {
  return createDomainEvent({
    eventType: "checkout.completed",
    aggregateType: "checkout",
    aggregateId: result.order.id,
    storeId: result.order.storeId,
    payload: {
      cartId: result.cart.id,
      orderId: result.order.id,
      customerProfileId: result.order.customerProfileId ?? result.cart.customerId,
      customerAddressId,
      order: result.order,
      cart: result.cart,
      result,
    },
  });
}

export function buildCheckoutShippingSelectedEvent(
  order: Order,
  appliedShippingMethod: OrderShippingMethodSnapshot,
  shippingAmount: string,
): DomainEvent<CheckoutShippingSelectedPayload> {
  return createDomainEvent({
    eventType: "checkout.shipping.selected",
    aggregateType: "checkout",
    aggregateId: order.id,
    storeId: order.storeId,
    payload: {
      orderId: order.id,
      shippingAmount,
      appliedShippingMethod,
      order,
    },
  });
}

export function buildPaymentCreatedEvent(
  payment: Payment,
): DomainEvent<PaymentCreatedPayload> {
  return createDomainEvent({
    eventType: "payment.created",
    aggregateType: "payment",
    aggregateId: payment.id,
    storeId: payment.storeId,
    payload: {
      paymentId: payment.id,
      orderId: payment.orderId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      provider: payment.provider,
      reference: payment.reference,
      payment,
    },
  });
}

export function buildPaymentAuthorizedEvent(
  payment: Payment,
  previousStatus: PaymentStatus,
): DomainEvent<PaymentAuthorizedPayload> {
  return createDomainEvent({
    eventType: "payment.authorized",
    aggregateType: "payment",
    aggregateId: payment.id,
    storeId: payment.storeId,
    payload: {
      paymentId: payment.id,
      orderId: payment.orderId,
      previousStatus,
      status: "authorized",
      amount: payment.amount,
      currency: payment.currency,
      payment,
    },
  });
}

export function buildPaymentPaidEvent(
  payment: Payment,
  previousStatus: PaymentStatus,
): DomainEvent<PaymentPaidPayload> {
  return createDomainEvent({
    eventType: "payment.paid",
    aggregateType: "payment",
    aggregateId: payment.id,
    storeId: payment.storeId,
    payload: {
      paymentId: payment.id,
      orderId: payment.orderId,
      previousStatus,
      status: "paid",
      amount: payment.amount,
      currency: payment.currency,
      payment,
    },
  });
}

export function buildPaymentFailedEvent(
  payment: Payment,
  previousStatus: PaymentStatus,
): DomainEvent<PaymentFailedPayload> {
  return createDomainEvent({
    eventType: "payment.failed",
    aggregateType: "payment",
    aggregateId: payment.id,
    storeId: payment.storeId,
    payload: {
      paymentId: payment.id,
      orderId: payment.orderId,
      previousStatus,
      status: "failed",
      amount: payment.amount,
      currency: payment.currency,
      payment,
    },
  });
}

export function buildPaymentCancelledEvent(
  payment: Payment,
  previousStatus: PaymentStatus,
): DomainEvent<PaymentCancelledPayload> {
  return createDomainEvent({
    eventType: "payment.cancelled",
    aggregateType: "payment",
    aggregateId: payment.id,
    storeId: payment.storeId,
    payload: {
      paymentId: payment.id,
      orderId: payment.orderId,
      previousStatus,
      status: "cancelled",
      amount: payment.amount,
      currency: payment.currency,
      payment,
    },
  });
}

export function buildInvoiceCreatedEvent(
  invoice: Invoice,
): DomainEvent<InvoiceCreatedPayload> {
  return createDomainEvent({
    eventType: "invoice.created",
    aggregateType: "invoice",
    aggregateId: invoice.id,
    storeId: invoice.storeId,
    payload: {
      invoiceId: invoice.id,
      orderId: invoice.orderId,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      subtotal: invoice.subtotal,
      discountAmount: invoice.discountAmount,
      total: invoice.total,
      currency: invoice.currency,
      invoice,
    },
  });
}

export function buildInvoiceIssuedEvent(
  invoice: Invoice,
  previousStatus: InvoiceStatus,
): DomainEvent<InvoiceIssuedPayload> {
  return createDomainEvent({
    eventType: "invoice.issued",
    aggregateType: "invoice",
    aggregateId: invoice.id,
    storeId: invoice.storeId,
    payload: {
      invoiceId: invoice.id,
      orderId: invoice.orderId,
      invoiceNumber: invoice.invoiceNumber,
      previousStatus,
      status: "issued",
      subtotal: invoice.subtotal,
      discountAmount: invoice.discountAmount,
      total: invoice.total,
      currency: invoice.currency,
      issuedAt: invoice.issuedAt,
      invoice,
    },
  });
}

export function buildInvoicePaidEvent(
  invoice: Invoice,
  previousStatus: InvoiceStatus,
): DomainEvent<InvoicePaidPayload> {
  return createDomainEvent({
    eventType: "invoice.paid",
    aggregateType: "invoice",
    aggregateId: invoice.id,
    storeId: invoice.storeId,
    payload: {
      invoiceId: invoice.id,
      orderId: invoice.orderId,
      invoiceNumber: invoice.invoiceNumber,
      previousStatus,
      status: "paid",
      subtotal: invoice.subtotal,
      discountAmount: invoice.discountAmount,
      total: invoice.total,
      currency: invoice.currency,
      paidAt: invoice.paidAt,
      invoice,
    },
  });
}

export function buildInvoiceVoidedEvent(
  invoice: Invoice,
  previousStatus: InvoiceStatus,
): DomainEvent<InvoiceVoidedPayload> {
  return createDomainEvent({
    eventType: "invoice.voided",
    aggregateType: "invoice",
    aggregateId: invoice.id,
    storeId: invoice.storeId,
    payload: {
      invoiceId: invoice.id,
      orderId: invoice.orderId,
      invoiceNumber: invoice.invoiceNumber,
      previousStatus,
      status: "void",
      subtotal: invoice.subtotal,
      discountAmount: invoice.discountAmount,
      total: invoice.total,
      currency: invoice.currency,
      invoice,
    },
  });
}

export function buildRefundCreatedEvent(
  refund: Refund,
): DomainEvent<RefundCreatedPayload> {
  return createDomainEvent({
    eventType: "refund.created",
    aggregateType: "refund",
    aggregateId: refund.id,
    storeId: refund.storeId,
    payload: {
      refundId: refund.id,
      paymentId: refund.paymentId,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status,
      reason: refund.reason,
      refund,
    },
  });
}

export function buildRefundCompletedEvent(
  refund: Refund,
  previousStatus: RefundStatus,
): DomainEvent<RefundCompletedPayload> {
  return createDomainEvent({
    eventType: "refund.completed",
    aggregateType: "refund",
    aggregateId: refund.id,
    storeId: refund.storeId,
    payload: {
      refundId: refund.id,
      paymentId: refund.paymentId,
      previousStatus,
      status: "completed",
      amount: refund.amount,
      currency: refund.currency,
      reason: refund.reason,
      completedAt: refund.completedAt,
      refund,
    },
  });
}

export function buildRefundCancelledEvent(
  refund: Refund,
  previousStatus: RefundStatus,
): DomainEvent<RefundCancelledPayload> {
  return createDomainEvent({
    eventType: "refund.cancelled",
    aggregateType: "refund",
    aggregateId: refund.id,
    storeId: refund.storeId,
    payload: {
      refundId: refund.id,
      paymentId: refund.paymentId,
      previousStatus,
      status: "cancelled",
      amount: refund.amount,
      currency: refund.currency,
      reason: refund.reason,
      refund,
    },
  });
}

export function buildPromotionCreatedEvent(
  promotion: Promotion,
): DomainEvent<PromotionCreatedPayload> {
  return createDomainEvent({
    eventType: "promotion.created",
    aggregateType: "promotion",
    aggregateId: promotion.id,
    storeId: promotion.storeId,
    payload: {
      promotionId: promotion.id,
      code: promotion.code,
      name: promotion.name,
      type: promotion.type,
      value: promotion.value,
      currency: promotion.currency,
      status: promotion.status,
      promotion,
    },
  });
}

export function buildPromotionUpdatedEvent(
  promotion: Promotion,
): DomainEvent<PromotionUpdatedPayload> {
  return createDomainEvent({
    eventType: "promotion.updated",
    aggregateType: "promotion",
    aggregateId: promotion.id,
    storeId: promotion.storeId,
    payload: {
      promotionId: promotion.id,
      code: promotion.code,
      name: promotion.name,
      type: promotion.type,
      value: promotion.value,
      currency: promotion.currency,
      status: promotion.status,
      promotion,
    },
  });
}

export function buildPromotionDeletedEvent(
  promotion: Promotion,
): DomainEvent<PromotionDeletedPayload> {
  return createDomainEvent({
    eventType: "promotion.deleted",
    aggregateType: "promotion",
    aggregateId: promotion.id,
    storeId: promotion.storeId,
    payload: {
      promotionId: promotion.id,
      code: promotion.code,
      name: promotion.name,
      status: promotion.status,
      promotion,
    },
  });
}

export function buildPromotionAppliedEvent(
  cart: Cart,
  applied: AppliedCartPromotion,
): DomainEvent<PromotionAppliedPayload> {
  return createDomainEvent({
    eventType: "promotion.applied",
    aggregateType: "promotion",
    aggregateId: applied.promotionId,
    storeId: cart.storeId,
    payload: {
      cartId: cart.id,
      promotionId: applied.promotionId,
      promotionCodeSnapshot: applied.promotionCodeSnapshot,
      promotionTypeSnapshot: applied.promotionTypeSnapshot,
      promotionValueSnapshot: applied.promotionValueSnapshot,
      discountAmount: applied.discountAmount,
      cartSubtotal: cart.subtotal,
    },
  });
}

export function buildPromotionRemovedEvent(
  cart: Cart,
  applied: AppliedCartPromotion,
): DomainEvent<PromotionRemovedPayload> {
  return createDomainEvent({
    eventType: "promotion.removed",
    aggregateType: "promotion",
    aggregateId: applied.promotionId,
    storeId: cart.storeId,
    payload: {
      cartId: cart.id,
      promotionId: applied.promotionId,
      promotionCodeSnapshot: applied.promotionCodeSnapshot,
    },
  });
}

export function buildTaxCreatedEvent(
  taxRate: TaxRate,
): DomainEvent<TaxCreatedPayload> {
  return createDomainEvent({
    eventType: "tax.created",
    aggregateType: "tax_rate",
    aggregateId: taxRate.id,
    storeId: taxRate.storeId,
    payload: {
      taxRateId: taxRate.id,
      name: taxRate.name,
      percentage: taxRate.percentage,
      status: taxRate.status,
      taxRate,
    },
  });
}

export function buildTaxUpdatedEvent(
  taxRate: TaxRate,
): DomainEvent<TaxUpdatedPayload> {
  return createDomainEvent({
    eventType: "tax.updated",
    aggregateType: "tax_rate",
    aggregateId: taxRate.id,
    storeId: taxRate.storeId,
    payload: {
      taxRateId: taxRate.id,
      name: taxRate.name,
      percentage: taxRate.percentage,
      status: taxRate.status,
      taxRate,
    },
  });
}

export function buildTaxActivatedEvent(
  taxRate: TaxRate,
  previousStatus: TaxRateStatus,
): DomainEvent<TaxActivatedPayload> {
  return createDomainEvent({
    eventType: "tax.activated",
    aggregateType: "tax_rate",
    aggregateId: taxRate.id,
    storeId: taxRate.storeId,
    payload: {
      taxRateId: taxRate.id,
      name: taxRate.name,
      percentage: taxRate.percentage,
      previousStatus,
      status: "active",
      taxRate,
    },
  });
}

export function buildTaxDeactivatedEvent(
  taxRate: TaxRate,
  previousStatus: TaxRateStatus,
): DomainEvent<TaxDeactivatedPayload> {
  return createDomainEvent({
    eventType: "tax.deactivated",
    aggregateType: "tax_rate",
    aggregateId: taxRate.id,
    storeId: taxRate.storeId,
    payload: {
      taxRateId: taxRate.id,
      name: taxRate.name,
      percentage: taxRate.percentage,
      previousStatus,
      status: "inactive",
      taxRate,
    },
  });
}

export function buildWarehouseCreatedEvent(
  warehouse: Warehouse,
): DomainEvent<WarehouseCreatedPayload> {
  return createDomainEvent({
    eventType: "warehouse.created",
    aggregateType: "warehouse",
    aggregateId: warehouse.id,
    storeId: warehouse.storeId,
    payload: {
      warehouseId: warehouse.id,
      name: warehouse.name,
      code: warehouse.code,
      status: warehouse.status,
      isDefault: warehouse.isDefault,
      warehouse,
    },
  });
}

export function buildWarehouseUpdatedEvent(
  warehouse: Warehouse,
): DomainEvent<WarehouseUpdatedPayload> {
  return createDomainEvent({
    eventType: "warehouse.updated",
    aggregateType: "warehouse",
    aggregateId: warehouse.id,
    storeId: warehouse.storeId,
    payload: {
      warehouseId: warehouse.id,
      name: warehouse.name,
      code: warehouse.code,
      status: warehouse.status,
      isDefault: warehouse.isDefault,
      warehouse,
    },
  });
}

export function buildWarehouseActivatedEvent(
  warehouse: Warehouse,
  previousStatus: WarehouseStatus,
): DomainEvent<WarehouseActivatedPayload> {
  return createDomainEvent({
    eventType: "warehouse.activated",
    aggregateType: "warehouse",
    aggregateId: warehouse.id,
    storeId: warehouse.storeId,
    payload: {
      warehouseId: warehouse.id,
      name: warehouse.name,
      code: warehouse.code,
      previousStatus,
      status: "active",
      isDefault: warehouse.isDefault,
      warehouse,
    },
  });
}

export function buildWarehouseDeactivatedEvent(
  warehouse: Warehouse,
  previousStatus: WarehouseStatus,
): DomainEvent<WarehouseDeactivatedPayload> {
  return createDomainEvent({
    eventType: "warehouse.deactivated",
    aggregateType: "warehouse",
    aggregateId: warehouse.id,
    storeId: warehouse.storeId,
    payload: {
      warehouseId: warehouse.id,
      name: warehouse.name,
      code: warehouse.code,
      previousStatus,
      status: "inactive",
      isDefault: warehouse.isDefault,
      warehouse,
    },
  });
}

export function buildWarehouseDeletedEvent(
  warehouse: Warehouse,
): DomainEvent<WarehouseDeletedPayload> {
  return createDomainEvent({
    eventType: "warehouse.deleted",
    aggregateType: "warehouse",
    aggregateId: warehouse.id,
    storeId: warehouse.storeId,
    payload: {
      warehouseId: warehouse.id,
      name: warehouse.name,
      code: warehouse.code,
      status: warehouse.status,
      isDefault: warehouse.isDefault,
      warehouse,
    },
  });
}

export function buildWarehouseTransferCreatedEvent(
  warehouseTransfer: WarehouseTransfer,
): DomainEvent<WarehouseTransferCreatedPayload> {
  return createDomainEvent({
    eventType: "warehouse-transfer.created",
    aggregateType: "warehouse_transfer",
    aggregateId: warehouseTransfer.id,
    storeId: warehouseTransfer.storeId,
    payload: {
      warehouseTransferId: warehouseTransfer.id,
      transferNumber: warehouseTransfer.transferNumber,
      status: warehouseTransfer.status,
      sourceWarehouseId: warehouseTransfer.sourceWarehouseId,
      destinationWarehouseId: warehouseTransfer.destinationWarehouseId,
      itemCount: warehouseTransfer.items.length,
      warehouseTransfer,
    },
  });
}

export function buildWarehouseTransferApprovedEvent(
  warehouseTransfer: WarehouseTransfer,
): DomainEvent<WarehouseTransferApprovedPayload> {
  return createDomainEvent({
    eventType: "warehouse-transfer.approved",
    aggregateType: "warehouse_transfer",
    aggregateId: warehouseTransfer.id,
    storeId: warehouseTransfer.storeId,
    payload: {
      warehouseTransferId: warehouseTransfer.id,
      transferNumber: warehouseTransfer.transferNumber,
      previousStatus: "draft",
      status: "approved",
      warehouseTransfer,
    },
  });
}

export function buildWarehouseTransferShippedEvent(
  result: WarehouseTransferShipResult,
): DomainEvent<WarehouseTransferShippedPayload> {
  return createDomainEvent({
    eventType: "warehouse-transfer.shipped",
    aggregateType: "warehouse_transfer",
    aggregateId: result.warehouseTransfer.id,
    storeId: result.warehouseTransfer.storeId,
    payload: {
      warehouseTransferId: result.warehouseTransfer.id,
      transferNumber: result.warehouseTransfer.transferNumber,
      previousStatus: "approved",
      status: "in_transit",
      stockMovementCount: result.stockMovements.length,
      result,
    },
  });
}

export function buildWarehouseTransferReceivedEvent(
  result: WarehouseTransferReceiveResult,
): DomainEvent<WarehouseTransferReceivedPayload> {
  return createDomainEvent({
    eventType: "warehouse-transfer.received",
    aggregateType: "warehouse_transfer",
    aggregateId: result.warehouseTransfer.id,
    storeId: result.warehouseTransfer.storeId,
    payload: {
      warehouseTransferId: result.warehouseTransfer.id,
      transferNumber: result.warehouseTransfer.transferNumber,
      previousStatus: "in_transit",
      status: "received",
      stockMovementCount: result.stockMovements.length,
      result,
    },
  });
}

export function buildWarehouseTransferCancelledEvent(
  warehouseTransfer: WarehouseTransfer,
  previousStatus: WarehouseTransfer["status"],
): DomainEvent<WarehouseTransferCancelledPayload> {
  return createDomainEvent({
    eventType: "warehouse-transfer.cancelled",
    aggregateType: "warehouse_transfer",
    aggregateId: warehouseTransfer.id,
    storeId: warehouseTransfer.storeId,
    payload: {
      warehouseTransferId: warehouseTransfer.id,
      transferNumber: warehouseTransfer.transferNumber,
      previousStatus,
      status: "cancelled",
      warehouseTransfer,
    },
  });
}

export function buildPurchaseOrderCreatedEvent(
  purchaseOrder: PurchaseOrder,
): DomainEvent<PurchaseOrderCreatedPayload> {
  return createDomainEvent({
    eventType: "purchase-order.created",
    aggregateType: "purchase_order",
    aggregateId: purchaseOrder.id,
    storeId: purchaseOrder.storeId,
    payload: {
      purchaseOrderId: purchaseOrder.id,
      purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
      status: purchaseOrder.status,
      warehouseId: purchaseOrder.warehouseId,
      supplierId: purchaseOrder.supplierId,
      itemCount: purchaseOrder.items.length,
      purchaseOrder,
    },
  });
}

export function buildPurchaseOrderApprovedEvent(
  purchaseOrder: PurchaseOrder,
): DomainEvent<PurchaseOrderApprovedPayload> {
  return createDomainEvent({
    eventType: "purchase-order.approved",
    aggregateType: "purchase_order",
    aggregateId: purchaseOrder.id,
    storeId: purchaseOrder.storeId,
    payload: {
      purchaseOrderId: purchaseOrder.id,
      purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
      previousStatus: "draft",
      status: "approved",
      purchaseOrder,
    },
  });
}

export function buildPurchaseOrderOrderedEvent(
  purchaseOrder: PurchaseOrder,
): DomainEvent<PurchaseOrderOrderedPayload> {
  return createDomainEvent({
    eventType: "purchase-order.ordered",
    aggregateType: "purchase_order",
    aggregateId: purchaseOrder.id,
    storeId: purchaseOrder.storeId,
    payload: {
      purchaseOrderId: purchaseOrder.id,
      purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
      previousStatus: "approved",
      status: "ordered",
      purchaseOrder,
    },
  });
}

export function buildPurchaseOrderReceivedEvent(
  result: PurchaseOrderReceiveResult,
  previousStatus: PurchaseOrder["status"],
): DomainEvent<PurchaseOrderReceivedPayload> {
  return createDomainEvent({
    eventType: "purchase-order.received",
    aggregateType: "purchase_order",
    aggregateId: result.purchaseOrder.id,
    storeId: result.purchaseOrder.storeId,
    payload: {
      purchaseOrderId: result.purchaseOrder.id,
      purchaseOrderNumber: result.purchaseOrder.purchaseOrderNumber,
      previousStatus,
      status: result.purchaseOrder.status,
      stockMovementCount: result.stockMovements.length,
      result,
    },
  });
}

export function buildPurchaseOrderCancelledEvent(
  purchaseOrder: PurchaseOrder,
  previousStatus: PurchaseOrder["status"],
): DomainEvent<PurchaseOrderCancelledPayload> {
  return createDomainEvent({
    eventType: "purchase-order.cancelled",
    aggregateType: "purchase_order",
    aggregateId: purchaseOrder.id,
    storeId: purchaseOrder.storeId,
    payload: {
      purchaseOrderId: purchaseOrder.id,
      purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
      previousStatus,
      status: "cancelled",
      purchaseOrder,
    },
  });
}

export function buildSupplierCreatedEvent(
  supplier: Supplier,
): DomainEvent<SupplierCreatedPayload> {
  return createDomainEvent({
    eventType: "supplier.created",
    aggregateType: "supplier",
    aggregateId: supplier.id,
    storeId: supplier.storeId,
    payload: {
      supplierId: supplier.id,
      code: supplier.code,
      name: supplier.name,
      status: supplier.status,
      supplier,
    },
  });
}

export function buildSupplierUpdatedEvent(
  supplier: Supplier,
): DomainEvent<SupplierUpdatedPayload> {
  return createDomainEvent({
    eventType: "supplier.updated",
    aggregateType: "supplier",
    aggregateId: supplier.id,
    storeId: supplier.storeId,
    payload: {
      supplierId: supplier.id,
      code: supplier.code,
      name: supplier.name,
      status: supplier.status,
      supplier,
    },
  });
}

export function buildSupplierDeletedEvent(
  supplier: Supplier,
): DomainEvent<SupplierDeletedPayload> {
  return createDomainEvent({
    eventType: "supplier.deleted",
    aggregateType: "supplier",
    aggregateId: supplier.id,
    storeId: supplier.storeId,
    payload: {
      supplierId: supplier.id,
      code: supplier.code,
      name: supplier.name,
      status: supplier.status,
      supplier,
    },
  });
}

export function buildSupplierContactCreatedEvent(
  contact: SupplierContact,
  storeId: string,
): DomainEvent<SupplierContactCreatedPayload> {
  return createDomainEvent({
    eventType: "supplier.contact.created",
    aggregateType: "supplier_contact",
    aggregateId: contact.id,
    storeId,
    payload: {
      supplierContactId: contact.id,
      supplierId: contact.supplierId,
      firstName: contact.firstName,
      lastName: contact.lastName,
      isPrimary: contact.isPrimary,
      contact,
    },
  });
}

export function buildSupplierContactUpdatedEvent(
  contact: SupplierContact,
  storeId: string,
): DomainEvent<SupplierContactUpdatedPayload> {
  return createDomainEvent({
    eventType: "supplier.contact.updated",
    aggregateType: "supplier_contact",
    aggregateId: contact.id,
    storeId,
    payload: {
      supplierContactId: contact.id,
      supplierId: contact.supplierId,
      firstName: contact.firstName,
      lastName: contact.lastName,
      isPrimary: contact.isPrimary,
      contact,
    },
  });
}

export function buildSupplierContactDeletedEvent(
  contact: SupplierContact,
  storeId: string,
): DomainEvent<SupplierContactDeletedPayload> {
  return createDomainEvent({
    eventType: "supplier.contact.deleted",
    aggregateType: "supplier_contact",
    aggregateId: contact.id,
    storeId,
    payload: {
      supplierContactId: contact.id,
      supplierId: contact.supplierId,
      firstName: contact.firstName,
      lastName: contact.lastName,
      isPrimary: contact.isPrimary,
      contact,
    },
  });
}

export function buildReplenishmentRuleCreatedEvent(
  rule: ReplenishmentRule,
): DomainEvent<ReplenishmentRuleCreatedPayload> {
  return createDomainEvent({
    eventType: "replenishment-rule.created",
    aggregateType: "replenishment_rule",
    aggregateId: rule.id,
    storeId: rule.storeId,
    payload: {
      replenishmentRuleId: rule.id,
      warehouseId: rule.warehouseId,
      productVariantId: rule.productVariantId,
      supplierId: rule.supplierId,
      reorderPoint: rule.reorderPoint,
      isEnabled: rule.isEnabled,
      rule,
    },
  });
}

export function buildReplenishmentRuleUpdatedEvent(
  rule: ReplenishmentRule,
): DomainEvent<ReplenishmentRuleUpdatedPayload> {
  return createDomainEvent({
    eventType: "replenishment-rule.updated",
    aggregateType: "replenishment_rule",
    aggregateId: rule.id,
    storeId: rule.storeId,
    payload: {
      replenishmentRuleId: rule.id,
      warehouseId: rule.warehouseId,
      productVariantId: rule.productVariantId,
      supplierId: rule.supplierId,
      reorderPoint: rule.reorderPoint,
      isEnabled: rule.isEnabled,
      rule,
    },
  });
}

export function buildReplenishmentRuleDeletedEvent(
  rule: ReplenishmentRule,
): DomainEvent<ReplenishmentRuleDeletedPayload> {
  return createDomainEvent({
    eventType: "replenishment-rule.deleted",
    aggregateType: "replenishment_rule",
    aggregateId: rule.id,
    storeId: rule.storeId,
    payload: {
      replenishmentRuleId: rule.id,
      warehouseId: rule.warehouseId,
      productVariantId: rule.productVariantId,
      supplierId: rule.supplierId,
      rule,
    },
  });
}

export function buildReplenishmentRecommendationGeneratedEvent(
  recommendation: ReplenishmentRecommendation,
): DomainEvent<ReplenishmentRecommendationGeneratedPayload> {
  return createDomainEvent({
    eventType: "replenishment.recommendation.generated",
    aggregateType: "replenishment_recommendation",
    aggregateId: recommendation.id,
    storeId: recommendation.storeId,
    payload: {
      replenishmentRecommendationId: recommendation.id,
      warehouseId: recommendation.warehouseId,
      productVariantId: recommendation.productVariantId,
      supplierId: recommendation.supplierId,
      recommendedQuantity: recommendation.recommendedQuantity,
      currentQuantity: recommendation.currentQuantity,
      reorderPoint: recommendation.reorderPoint,
      status: recommendation.status,
      recommendation,
    },
  });
}

export function buildReplenishmentRecommendationAcceptedEvent(
  result: AcceptReplenishmentRecommendationResult,
): DomainEvent<ReplenishmentRecommendationAcceptedPayload> {
  return createDomainEvent({
    eventType: "replenishment.recommendation.accepted",
    aggregateType: "replenishment_recommendation",
    aggregateId: result.recommendation.id,
    storeId: result.recommendation.storeId,
    payload: {
      replenishmentRecommendationId: result.recommendation.id,
      warehouseId: result.recommendation.warehouseId,
      productVariantId: result.recommendation.productVariantId,
      supplierId: result.recommendation.supplierId,
      purchaseOrderId: result.purchaseOrder.id,
      purchaseOrderCreated: result.purchaseOrderCreated,
      recommendation: result.recommendation,
      result,
    },
  });
}

export function buildReplenishmentRecommendationDismissedEvent(
  recommendation: ReplenishmentRecommendation,
): DomainEvent<ReplenishmentRecommendationDismissedPayload> {
  return createDomainEvent({
    eventType: "replenishment.recommendation.dismissed",
    aggregateType: "replenishment_recommendation",
    aggregateId: recommendation.id,
    storeId: recommendation.storeId,
    payload: {
      replenishmentRecommendationId: recommendation.id,
      warehouseId: recommendation.warehouseId,
      productVariantId: recommendation.productVariantId,
      supplierId: recommendation.supplierId,
      status: "dismissed",
      recommendation,
    },
  });
}

export function buildOperationsIntegrityCheckedEvent(
  storeId: string,
  result: IntegrityCheckResult,
): DomainEvent<OperationsIntegrityCheckedPayload> {
  return createDomainEvent({
    eventType: "operations.integrity.checked",
    aggregateType: "operations",
    aggregateId: storeId,
    storeId,
    payload: {
      storeId,
      valid: result.valid,
      issueCount: result.issues.length,
      result,
    },
  });
}

export function buildWarehouseIntegrityCheckedEvent(
  storeId: string,
  result: IntegrityCheckResult,
): DomainEvent<WarehouseIntegrityCheckedPayload> {
  return createDomainEvent({
    eventType: "warehouse.integrity.checked",
    aggregateType: "operations",
    aggregateId: storeId,
    storeId,
    payload: {
      storeId,
      valid: result.valid,
      issueCount: result.issues.length,
      result,
    },
  });
}

export function buildInventoryIntegrityCheckedEvent(
  storeId: string,
  result: IntegrityCheckResult,
): DomainEvent<InventoryIntegrityCheckedPayload> {
  return createDomainEvent({
    eventType: "inventory.integrity.checked",
    aggregateType: "operations",
    aggregateId: storeId,
    storeId,
    payload: {
      storeId,
      valid: result.valid,
      issueCount: result.issues.length,
      result,
    },
  });
}

export function buildOperationsPhase3ValidationCompletedEvent(
  storeId: string,
  result: Phase3ValidationResult,
): DomainEvent<OperationsPhase3ValidationCompletedPayload> {
  return createDomainEvent({
    eventType: "operations.phase3.validation.completed",
    aggregateType: "operations",
    aggregateId: storeId,
    storeId,
    payload: {
      storeId,
      valid: result.valid,
      overallStatus: result.overallStatus,
      issueCount: result.issues.length,
      result,
    },
  });
}

export function buildOperationsReadinessGeneratedEvent(
  storeId: string,
  report: Phase3ReadinessReport,
): DomainEvent<OperationsReadinessGeneratedPayload> {
  return createDomainEvent({
    eventType: "operations.readiness.generated",
    aggregateType: "operations",
    aggregateId: storeId,
    storeId,
    payload: {
      storeId,
      overallStatus: report.overallStatus,
      issueCount: report.validation.issues.length,
      report,
    },
  });
}

export function buildReportsGeneratedEvent(
  storeId: string,
  report: ReportDashboardResponse,
): DomainEvent<ReportsGeneratedPayload> {
  return createDomainEvent({
    eventType: "reports.generated",
    aggregateType: "report",
    aggregateId: storeId,
    storeId,
    payload: {
      storeId,
      metricCount: report.metrics.length,
      rowCount: report.summary.rowCount,
      report,
    },
  });
}

export function buildDashboardViewedEvent(
  storeId: string,
  report: ReportDashboardResponse,
): DomainEvent<DashboardViewedPayload> {
  return createDomainEvent({
    eventType: "dashboard.viewed",
    aggregateType: "report",
    aggregateId: storeId,
    storeId,
    payload: {
      storeId,
      timezone: report.timezone,
      currency: report.currency,
      report,
    },
  });
}

export function buildSalesReportGeneratedEvent(
  storeId: string,
  reportKind: SalesReportKind,
  orderCount: number,
  report: SalesSummary | SalesTimelineReport | SalesOrdersReport,
): DomainEvent<SalesReportGeneratedPayload> {
  return createDomainEvent({
    eventType: "reports.sales.generated",
    aggregateType: "sales_report",
    aggregateId: storeId,
    storeId,
    payload: {
      storeId,
      reportKind,
      orderCount,
      report,
    },
  });
}

export function buildInventoryReportGeneratedEvent(
  storeId: string,
  reportKind: InventoryReportKind,
  rowCount: number,
  report:
    | InventorySummary
    | InventoryMovementReport
    | LowStockReport
    | InventoryValuationReport,
): DomainEvent<InventoryReportGeneratedPayload> {
  return createDomainEvent({
    eventType: "reports.inventory.generated",
    aggregateType: "inventory_report",
    aggregateId: storeId,
    storeId,
    payload: {
      storeId,
      reportKind,
      rowCount,
      report,
    },
  });
}

export function buildCustomerReportGeneratedEvent(
  storeId: string,
  reportKind: CustomerReportKind,
  rowCount: number,
  report:
    | CustomerSummary
    | CustomerGrowthReport
    | TopCustomersReport
    | CustomerOrdersReport,
): DomainEvent<CustomerReportGeneratedPayload> {
  return createDomainEvent({
    eventType: "reports.customers.generated",
    aggregateType: "customer_report",
    aggregateId: storeId,
    storeId,
    payload: {
      storeId,
      reportKind,
      rowCount,
      report,
    },
  });
}

export function buildFinancialReportGeneratedEvent(
  storeId: string,
  reportKind: FinancialReportKind,
  rowCount: number,
  report:
    | FinancialSummary
    | RevenueTimelineReport
    | PaymentReport
    | InvoiceReport
    | RefundReport,
): DomainEvent<FinancialReportGeneratedPayload> {
  return createDomainEvent({
    eventType: "reports.financial.generated",
    aggregateType: "financial_report",
    aggregateId: storeId,
    storeId,
    payload: {
      storeId,
      reportKind,
      rowCount,
      report,
    },
  });
}

export function buildProcurementReportGeneratedEvent(
  storeId: string,
  reportKind: ProcurementReportKind,
  rowCount: number,
  report:
    | ProcurementSummary
    | PurchaseOrderAnalytics
    | SupplierAnalytics
    | WarehouseAnalytics
    | ReplenishmentAnalytics,
): DomainEvent<ProcurementReportGeneratedPayload> {
  return createDomainEvent({
    eventType: "reports.procurement.generated",
    aggregateType: "procurement_report",
    aggregateId: storeId,
    storeId,
    payload: {
      storeId,
      reportKind,
      rowCount,
      report,
    },
  });
}

export function buildDashboardReportGeneratedEvent(
  storeId: string,
  reportKind: DashboardReportKind,
  rowCount: number,
  report: ExecutiveDashboard | DashboardKPIReport,
): DomainEvent<DashboardReportGeneratedPayload> {
  return createDomainEvent({
    eventType: "reports.dashboard.generated",
    aggregateType: "dashboard_report",
    aggregateId: storeId,
    storeId,
    payload: {
      storeId,
      reportKind,
      rowCount,
      report,
    },
  });
}

export function buildShipmentCreatedEvent(
  shipment: Shipment,
): DomainEvent<ShipmentCreatedPayload> {
  return createDomainEvent({
    eventType: "shipment.created",
    aggregateType: "shipment",
    aggregateId: shipment.id,
    storeId: shipment.storeId,
    payload: {
      shipmentId: shipment.id,
      orderId: shipment.orderId,
      shipmentNumber: shipment.shipmentNumber,
      status: shipment.status,
      carrier: shipment.carrier,
      shipment,
    },
  });
}

export function buildShipmentShippedEvent(
  shipment: Shipment,
  previousStatus: ShipmentStatus,
): DomainEvent<ShipmentShippedPayload> {
  return createDomainEvent({
    eventType: "shipment.shipped",
    aggregateType: "shipment",
    aggregateId: shipment.id,
    storeId: shipment.storeId,
    payload: {
      shipmentId: shipment.id,
      orderId: shipment.orderId,
      shipmentNumber: shipment.shipmentNumber,
      previousStatus,
      status: "shipped",
      shippedAt: shipment.shippedAt,
      shipment,
    },
  });
}

export function buildShipmentDeliveredEvent(
  shipment: Shipment,
  previousStatus: ShipmentStatus,
): DomainEvent<ShipmentDeliveredPayload> {
  return createDomainEvent({
    eventType: "shipment.delivered",
    aggregateType: "shipment",
    aggregateId: shipment.id,
    storeId: shipment.storeId,
    payload: {
      shipmentId: shipment.id,
      orderId: shipment.orderId,
      shipmentNumber: shipment.shipmentNumber,
      previousStatus,
      status: "delivered",
      deliveredAt: shipment.deliveredAt,
      shipment,
    },
  });
}

export function buildShipmentCancelledEvent(
  shipment: Shipment,
  previousStatus: ShipmentStatus,
): DomainEvent<ShipmentCancelledPayload> {
  return createDomainEvent({
    eventType: "shipment.cancelled",
    aggregateType: "shipment",
    aggregateId: shipment.id,
    storeId: shipment.storeId,
    payload: {
      shipmentId: shipment.id,
      orderId: shipment.orderId,
      shipmentNumber: shipment.shipmentNumber,
      previousStatus,
      status: "cancelled",
      shipment,
    },
  });
}

export function buildShipmentTrackingUpdatedEvent(
  shipment: Shipment,
  trackingEvent: ShipmentTrackingEvent,
): DomainEvent<ShipmentTrackingUpdatedPayload> {
  return createDomainEvent({
    eventType: "shipment.tracking.updated",
    aggregateType: "shipment",
    aggregateId: shipment.id,
    storeId: shipment.storeId,
    payload: {
      shipmentId: shipment.id,
      orderId: shipment.orderId,
      shipmentNumber: shipment.shipmentNumber,
      statusSnapshot: trackingEvent.statusSnapshot,
      trackingEvent,
      shipment,
    },
  });
}

export function buildShipmentPackageCreatedEvent(
  shipment: Shipment,
  shipmentPackage: ShipmentPackage,
): DomainEvent<ShipmentPackageCreatedPayload> {
  return createDomainEvent({
    eventType: "shipment.package.created",
    aggregateType: "shipment_package",
    aggregateId: shipmentPackage.id,
    storeId: shipmentPackage.storeId,
    payload: {
      shipmentPackageId: shipmentPackage.id,
      shipmentId: shipment.id,
      packageNumber: shipmentPackage.packageNumber,
      shipmentPackage,
      shipment,
    },
  });
}

export function buildShipmentPackageUpdatedEvent(
  shipment: Shipment,
  shipmentPackage: ShipmentPackage,
): DomainEvent<ShipmentPackageUpdatedPayload> {
  return createDomainEvent({
    eventType: "shipment.package.updated",
    aggregateType: "shipment_package",
    aggregateId: shipmentPackage.id,
    storeId: shipmentPackage.storeId,
    payload: {
      shipmentPackageId: shipmentPackage.id,
      shipmentId: shipment.id,
      packageNumber: shipmentPackage.packageNumber,
      shipmentPackage,
      shipment,
    },
  });
}

export function buildShipmentPackageDeletedEvent(
  shipment: Shipment,
  shipmentPackage: ShipmentPackage,
): DomainEvent<ShipmentPackageDeletedPayload> {
  return createDomainEvent({
    eventType: "shipment.package.deleted",
    aggregateType: "shipment_package",
    aggregateId: shipmentPackage.id,
    storeId: shipmentPackage.storeId,
    payload: {
      shipmentPackageId: shipmentPackage.id,
      shipmentId: shipment.id,
      packageNumber: shipmentPackage.packageNumber,
      shipmentPackage,
      shipment,
    },
  });
}

export function buildPickListCreatedEvent(
  pickList: PickList,
): DomainEvent<PickListCreatedPayload> {
  return createDomainEvent({
    eventType: "pick-list.created",
    aggregateType: "pick_list",
    aggregateId: pickList.id,
    storeId: pickList.storeId,
    payload: {
      pickListId: pickList.id,
      shipmentId: pickList.shipmentId,
      status: pickList.status,
      pickList,
    },
  });
}

export function buildPickListStartedEvent(
  pickList: PickList,
  previousStatus: "pending",
): DomainEvent<PickListStartedPayload> {
  return createDomainEvent({
    eventType: "pick-list.started",
    aggregateType: "pick_list",
    aggregateId: pickList.id,
    storeId: pickList.storeId,
    payload: {
      pickListId: pickList.id,
      shipmentId: pickList.shipmentId,
      previousStatus,
      status: "picking",
      pickList,
    },
  });
}

export function buildPickListCompletedEvent(
  pickList: PickList,
  previousStatus: "picking",
): DomainEvent<PickListCompletedPayload> {
  return createDomainEvent({
    eventType: "pick-list.completed",
    aggregateType: "pick_list",
    aggregateId: pickList.id,
    storeId: pickList.storeId,
    payload: {
      pickListId: pickList.id,
      shipmentId: pickList.shipmentId,
      previousStatus,
      status: "picked",
      pickList,
    },
  });
}

export function buildPickListPackedEvent(
  pickList: PickList,
  previousStatus: "picked",
): DomainEvent<PickListPackedPayload> {
  return createDomainEvent({
    eventType: "pick-list.packed",
    aggregateType: "pick_list",
    aggregateId: pickList.id,
    storeId: pickList.storeId,
    payload: {
      pickListId: pickList.id,
      shipmentId: pickList.shipmentId,
      previousStatus,
      status: "packed",
      pickList,
    },
  });
}

export function buildInventoryAllocatedEvent(
  allocation: InventoryAllocation,
): DomainEvent<InventoryAllocatedPayload> {
  return createDomainEvent({
    eventType: "inventory.allocated",
    aggregateType: "inventory_allocation",
    aggregateId: allocation.id,
    storeId: allocation.storeId,
    payload: {
      inventoryAllocationId: allocation.id,
      pickListItemId: allocation.pickListItemId,
      inventoryItemId: allocation.inventoryItemId,
      quantityAllocated: allocation.quantityAllocated,
      status: allocation.status,
      inventoryAllocation: allocation,
    },
  });
}

export function buildInventoryPartiallyPickedEvent(
  allocation: InventoryAllocation,
  previousStatus: InventoryAllocationStatus,
): DomainEvent<InventoryPartiallyPickedPayload> {
  return createDomainEvent({
    eventType: "inventory.partially-picked",
    aggregateType: "inventory_allocation",
    aggregateId: allocation.id,
    storeId: allocation.storeId,
    payload: {
      inventoryAllocationId: allocation.id,
      pickListItemId: allocation.pickListItemId,
      inventoryItemId: allocation.inventoryItemId,
      previousStatus,
      status: "partially_picked",
      quantityPicked: allocation.quantityPicked,
      quantityAllocated: allocation.quantityAllocated,
      inventoryAllocation: allocation,
    },
  });
}

export function buildInventoryPickedEvent(
  allocation: InventoryAllocation,
  previousStatus: InventoryAllocationStatus,
): DomainEvent<InventoryPickedPayload> {
  return createDomainEvent({
    eventType: "inventory.picked",
    aggregateType: "inventory_allocation",
    aggregateId: allocation.id,
    storeId: allocation.storeId,
    payload: {
      inventoryAllocationId: allocation.id,
      pickListItemId: allocation.pickListItemId,
      inventoryItemId: allocation.inventoryItemId,
      previousStatus,
      status: "picked",
      quantityPicked: allocation.quantityPicked,
      quantityAllocated: allocation.quantityAllocated,
      inventoryAllocation: allocation,
    },
  });
}

export function buildInventoryShortageReportedEvent(
  allocation: InventoryAllocation,
  previousStatus: InventoryAllocationStatus,
): DomainEvent<InventoryShortageReportedPayload> {
  return createDomainEvent({
    eventType: "inventory.shortage-reported",
    aggregateType: "inventory_allocation",
    aggregateId: allocation.id,
    storeId: allocation.storeId,
    payload: {
      inventoryAllocationId: allocation.id,
      pickListItemId: allocation.pickListItemId,
      inventoryItemId: allocation.inventoryItemId,
      previousStatus,
      status: "shortage",
      shortageReason: allocation.shortageReason ?? "",
      quantityPicked: allocation.quantityPicked,
      quantityAllocated: allocation.quantityAllocated,
      inventoryAllocation: allocation,
    },
  });
}

export function buildInventoryFulfilledEvent(
  result: ShipmentFulfillmentResult,
): DomainEvent<InventoryFulfilledPayload> {
  return createDomainEvent({
    eventType: "inventory.fulfilled",
    aggregateType: "shipment",
    aggregateId: result.shipment.id,
    storeId: result.shipment.storeId,
    payload: {
      shipmentId: result.shipment.id,
      shipmentNumber: result.shipment.shipmentNumber,
      stockMovementCount: result.stockMovements.length,
      allocationCount: result.allocations.length,
      result,
    },
  });
}

export function buildStockMovementCreatedEvent(
  stockMovement: StockMovement,
): DomainEvent<StockMovementCreatedPayload> {
  return createDomainEvent({
    eventType: "stock-movement.created",
    aggregateType: "stock_movement",
    aggregateId: stockMovement.id,
    storeId: stockMovement.storeId,
    payload: {
      stockMovementId: stockMovement.id,
      inventoryItemId: stockMovement.inventoryItemId,
      movementType: stockMovement.movementType,
      quantity: stockMovement.quantity,
      previousQuantityOnHand: stockMovement.previousQuantityOnHand,
      newQuantityOnHand: stockMovement.newQuantityOnHand,
      shipmentId: stockMovement.shipmentId,
      inventoryAllocationId: stockMovement.inventoryAllocationId,
      stockMovement,
    },
  });
}

export function buildReturnCreatedEvent(
  returnRecord: Return,
): DomainEvent<ReturnCreatedPayload> {
  return createDomainEvent({
    eventType: "return.created",
    aggregateType: "return",
    aggregateId: returnRecord.id,
    storeId: returnRecord.storeId,
    payload: {
      returnId: returnRecord.id,
      orderId: returnRecord.orderId,
      shipmentId: returnRecord.shipmentId,
      returnNumber: returnRecord.returnNumber,
      status: returnRecord.status,
      return: returnRecord,
    },
  });
}

export function buildReturnReceivedEvent(
  returnRecord: Return,
): DomainEvent<ReturnReceivedPayload> {
  return createDomainEvent({
    eventType: "return.received",
    aggregateType: "return",
    aggregateId: returnRecord.id,
    storeId: returnRecord.storeId,
    payload: {
      returnId: returnRecord.id,
      orderId: returnRecord.orderId,
      shipmentId: returnRecord.shipmentId,
      returnNumber: returnRecord.returnNumber,
      status: returnRecord.status,
      return: returnRecord,
    },
  });
}

export function buildReturnInspectedEvent(
  returnRecord: Return,
): DomainEvent<ReturnInspectedPayload> {
  return createDomainEvent({
    eventType: "return.inspected",
    aggregateType: "return",
    aggregateId: returnRecord.id,
    storeId: returnRecord.storeId,
    payload: {
      returnId: returnRecord.id,
      orderId: returnRecord.orderId,
      shipmentId: returnRecord.shipmentId,
      returnNumber: returnRecord.returnNumber,
      status: returnRecord.status,
      return: returnRecord,
    },
  });
}

export function buildReturnCompletedEvent(
  result: ReturnCompletionResult,
): DomainEvent<ReturnCompletedPayload> {
  return createDomainEvent({
    eventType: "return.completed",
    aggregateType: "return",
    aggregateId: result.return.id,
    storeId: result.return.storeId,
    payload: {
      returnId: result.return.id,
      orderId: result.return.orderId,
      shipmentId: result.return.shipmentId,
      returnNumber: result.return.returnNumber,
      status: result.return.status,
      stockMovementCount: result.stockMovements.length,
      result,
    },
  });
}

export function buildInventoryAdjustedEvent(
  result: InventoryAdjustmentResult,
): DomainEvent<InventoryAdjustedPayload> {
  return createDomainEvent({
    eventType: "inventory.adjusted",
    aggregateType: "inventory_adjustment",
    aggregateId: result.adjustment.id,
    storeId: result.adjustment.storeId,
    payload: {
      inventoryAdjustmentId: result.adjustment.id,
      inventoryItemId: result.adjustment.inventoryItemId,
      adjustmentNumber: result.adjustment.adjustmentNumber,
      movementQuantity: result.adjustment.movementQuantity,
      previousQuantityOnHand: result.adjustment.previousQuantityOnHand,
      newQuantityOnHand: result.adjustment.newQuantityOnHand,
      reason: result.adjustment.reason,
      result,
    },
  });
}

export function buildCycleCountCreatedEvent(
  cycleCount: CycleCount,
): DomainEvent<CycleCountCreatedPayload> {
  return createDomainEvent({
    eventType: "cycle-count.created",
    aggregateType: "cycle_count",
    aggregateId: cycleCount.id,
    storeId: cycleCount.storeId,
    payload: {
      cycleCountId: cycleCount.id,
      cycleCountNumber: cycleCount.cycleCountNumber,
      status: cycleCount.status,
      itemCount: cycleCount.items.length,
      cycleCount,
    },
  });
}

export function buildCycleCountStartedEvent(
  cycleCount: CycleCount,
): DomainEvent<CycleCountStartedPayload> {
  return createDomainEvent({
    eventType: "cycle-count.started",
    aggregateType: "cycle_count",
    aggregateId: cycleCount.id,
    storeId: cycleCount.storeId,
    payload: {
      cycleCountId: cycleCount.id,
      cycleCountNumber: cycleCount.cycleCountNumber,
      previousStatus: "draft",
      status: "counting",
      cycleCount,
    },
  });
}

export function buildCycleCountCompletedEvent(
  cycleCount: CycleCount,
): DomainEvent<CycleCountCompletedPayload> {
  return createDomainEvent({
    eventType: "cycle-count.completed",
    aggregateType: "cycle_count",
    aggregateId: cycleCount.id,
    storeId: cycleCount.storeId,
    payload: {
      cycleCountId: cycleCount.id,
      cycleCountNumber: cycleCount.cycleCountNumber,
      previousStatus: "counting",
      status: "completed",
      cycleCount,
    },
  });
}

export function buildCycleCountApprovedEvent(
  result: CycleCountApprovalResult,
): DomainEvent<CycleCountApprovedPayload> {
  return createDomainEvent({
    eventType: "cycle-count.approved",
    aggregateType: "cycle_count",
    aggregateId: result.cycleCount.id,
    storeId: result.cycleCount.storeId,
    payload: {
      cycleCountId: result.cycleCount.id,
      cycleCountNumber: result.cycleCount.cycleCountNumber,
      previousStatus: "completed",
      status: "approved",
      adjustmentCount: result.adjustments.length,
      stockMovementCount: result.stockMovements.length,
      result,
    },
  });
}

export function buildShippingZoneCreatedEvent(
  shippingZone: ShippingZone,
): DomainEvent<ShippingZoneCreatedPayload> {
  return createDomainEvent({
    eventType: "shipping-zone.created",
    aggregateType: "shipping_zone",
    aggregateId: shippingZone.id,
    storeId: shippingZone.storeId,
    payload: {
      shippingZoneId: shippingZone.id,
      name: shippingZone.name,
      countries: shippingZone.countries,
      status: shippingZone.status,
      shippingZone,
    },
  });
}

export function buildShippingZoneUpdatedEvent(
  shippingZone: ShippingZone,
): DomainEvent<ShippingZoneUpdatedPayload> {
  return createDomainEvent({
    eventType: "shipping-zone.updated",
    aggregateType: "shipping_zone",
    aggregateId: shippingZone.id,
    storeId: shippingZone.storeId,
    payload: {
      shippingZoneId: shippingZone.id,
      name: shippingZone.name,
      countries: shippingZone.countries,
      status: shippingZone.status,
      shippingZone,
    },
  });
}

export function buildShippingZoneDeletedEvent(
  shippingZone: ShippingZone,
): DomainEvent<ShippingZoneDeletedPayload> {
  return createDomainEvent({
    eventType: "shipping-zone.deleted",
    aggregateType: "shipping_zone",
    aggregateId: shippingZone.id,
    storeId: shippingZone.storeId,
    payload: {
      shippingZoneId: shippingZone.id,
      name: shippingZone.name,
      status: shippingZone.status,
      shippingZone,
    },
  });
}

export function buildShippingMethodCreatedEvent(
  shippingMethod: ShippingMethod,
): DomainEvent<ShippingMethodCreatedPayload> {
  return createDomainEvent({
    eventType: "shipping-method.created",
    aggregateType: "shipping_method",
    aggregateId: shippingMethod.id,
    storeId: shippingMethod.storeId,
    payload: {
      shippingMethodId: shippingMethod.id,
      shippingZoneId: shippingMethod.shippingZoneId,
      name: shippingMethod.name,
      carrier: shippingMethod.carrier,
      flatRate: shippingMethod.flatRate,
      currency: shippingMethod.currency,
      status: shippingMethod.status,
      shippingMethod,
    },
  });
}

export function buildShippingMethodUpdatedEvent(
  shippingMethod: ShippingMethod,
): DomainEvent<ShippingMethodUpdatedPayload> {
  return createDomainEvent({
    eventType: "shipping-method.updated",
    aggregateType: "shipping_method",
    aggregateId: shippingMethod.id,
    storeId: shippingMethod.storeId,
    payload: {
      shippingMethodId: shippingMethod.id,
      shippingZoneId: shippingMethod.shippingZoneId,
      name: shippingMethod.name,
      carrier: shippingMethod.carrier,
      flatRate: shippingMethod.flatRate,
      currency: shippingMethod.currency,
      status: shippingMethod.status,
      shippingMethod,
    },
  });
}

export function buildShippingMethodDeletedEvent(
  shippingMethod: ShippingMethod,
): DomainEvent<ShippingMethodDeletedPayload> {
  return createDomainEvent({
    eventType: "shipping-method.deleted",
    aggregateType: "shipping_method",
    aggregateId: shippingMethod.id,
    storeId: shippingMethod.storeId,
    payload: {
      shippingMethodId: shippingMethod.id,
      shippingZoneId: shippingMethod.shippingZoneId,
      name: shippingMethod.name,
      status: shippingMethod.status,
      shippingMethod,
    },
  });
}
