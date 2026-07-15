import type {
  OrderAppliedPromotion as PrismaOrderAppliedPromotion,
  OrderAppliedTaxRate as PrismaOrderAppliedTaxRate,
  OrderAppliedShippingMethod as PrismaOrderAppliedShippingMethod,
  Order as PrismaOrder,
  OrderItem as PrismaOrderItem,
} from "@prisma/client";
import type {
  Order,
  OrderPromotionSnapshot,
  OrderShippingMethodSnapshot,
  OrderTaxRateSnapshot,
} from "@commerceflow/types";

import { toOrderAddressSnapshot } from "./order-address.mapper";

type OrderWithItems = PrismaOrder & {
  items: PrismaOrderItem[];
  appliedPromotion?: PrismaOrderAppliedPromotion | null;
  appliedTaxRate?: PrismaOrderAppliedTaxRate | null;
  appliedShippingMethod?: PrismaOrderAppliedShippingMethod | null;
};

function toOrderShippingMethodSnapshot(
  record: PrismaOrderAppliedShippingMethod,
): OrderShippingMethodSnapshot {
  return {
    shippingMethodId: record.shippingMethodId,
    shippingZoneId: record.shippingZoneId,
    methodNameSnapshot: record.methodNameSnapshot,
    zoneNameSnapshot: record.zoneNameSnapshot,
    carrierSnapshot: record.carrierSnapshot,
    flatRateSnapshot: record.flatRateSnapshot.toString(),
    currencySnapshot: record.currencySnapshot,
    shippingAmount: record.shippingAmount.toString(),
  };
}

function toOrderTaxRateSnapshot(
  record: PrismaOrderAppliedTaxRate,
): OrderTaxRateSnapshot {
  return {
    taxRateId: record.taxRateId,
    nameSnapshot: record.nameSnapshot,
    percentageSnapshot: record.percentageSnapshot.toString(),
  };
}

function toOrderPromotionSnapshot(
  record: PrismaOrderAppliedPromotion,
): OrderPromotionSnapshot {
  return {
    promotionId: record.promotionId,
    promotionCodeSnapshot: record.promotionCodeSnapshot,
    promotionTypeSnapshot: record.promotionTypeSnapshot,
    promotionValueSnapshot: record.promotionValueSnapshot.toString(),
    discountAmount: record.discountAmount.toString(),
  };
}

function toOrderItem(record: PrismaOrderItem) {
  return {
    id: record.id,
    orderId: record.orderId,
    productVariantId: record.productVariantId,
    productName: record.productName,
    sku: record.sku,
    unitPrice: record.unitPrice.toString(),
    currency: record.currency,
    quantity: record.quantity,
    lineSubtotal: record.lineSubtotal.toString(),
    createdAt: record.createdAt.toISOString(),
  };
}

export function mapPrismaOrder(record: OrderWithItems): Order {
  return {
    id: record.id,
    storeId: record.storeId,
    customerId: record.customerId ?? undefined,
    customerProfileId: record.customerProfileId ?? undefined,
    sourceCartId: record.sourceCartId ?? undefined,
    orderNumber: record.orderNumber,
    status: record.status,
    subtotal: record.subtotal.toString(),
    discountAmount: record.discountAmount?.toString(),
    taxAmount: record.taxAmount?.toString(),
    shippingAmount: record.shippingAmount?.toString(),
    total: record.total.toString(),
    currency: record.currency,
    appliedPromotion: record.appliedPromotion
      ? toOrderPromotionSnapshot(record.appliedPromotion)
      : undefined,
    appliedTaxRate: record.appliedTaxRate
      ? toOrderTaxRateSnapshot(record.appliedTaxRate)
      : undefined,
    appliedShippingMethod: record.appliedShippingMethod
      ? toOrderShippingMethodSnapshot(record.appliedShippingMethod)
      : undefined,
    shippingAddress: toOrderAddressSnapshot(record),
    items: record.items.map(toOrderItem),
    confirmedAt: record.confirmedAt?.toISOString(),
    cancelledAt: record.cancelledAt?.toISOString(),
    fulfilledAt: record.fulfilledAt?.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export const orderItemsInclude = {
  orderBy: { createdAt: "asc" as const },
};

export const orderWithPromotionInclude = {
  items: orderItemsInclude,
  appliedPromotion: true,
  appliedTaxRate: true,
  appliedShippingMethod: true,
};
