import type {
  OrderAppliedPromotion as PrismaOrderAppliedPromotion,
  Order as PrismaOrder,
  OrderItem as PrismaOrderItem,
} from "@prisma/client";
import type { Order, OrderPromotionSnapshot } from "@commerceflow/types";

import { toOrderAddressSnapshot } from "./order-address.mapper";

type OrderWithItems = PrismaOrder & {
  items: PrismaOrderItem[];
  appliedPromotion?: PrismaOrderAppliedPromotion | null;
};

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
    total: record.total.toString(),
    currency: record.currency,
    appliedPromotion: record.appliedPromotion
      ? toOrderPromotionSnapshot(record.appliedPromotion)
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
};
