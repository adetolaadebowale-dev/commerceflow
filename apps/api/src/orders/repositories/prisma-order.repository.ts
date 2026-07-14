import {
  type PrismaClient,
  type Order as PrismaOrder,
  type OrderItem as PrismaOrderItem,
} from "@prisma/client";
import {
  buildCatalogueListResult,
  type Order,
  type OrderItem,
} from "@commerceflow/types";
import type { ListOrdersQuery } from "@commerceflow/validation";

import type { CreateOrderRecord } from "./order-create-record";
import type { OrderRepository } from "./order.repository";
import { generateOrderNumber } from "../services/order-pricing";
import { isUniqueOrderNumberViolation } from "./prisma-order-variant-snapshot.reader";

type OrderWithItems = PrismaOrder & {
  items: PrismaOrderItem[];
};

const MAX_ORDER_NUMBER_ATTEMPTS = 5;

function toOrderItem(record: PrismaOrderItem): OrderItem {
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

function toOrder(record: OrderWithItems): Order {
  return {
    id: record.id,
    storeId: record.storeId,
    customerId: record.customerId ?? undefined,
    orderNumber: record.orderNumber,
    status: record.status,
    subtotal: record.subtotal.toString(),
    currency: record.currency,
    items: record.items.map(toOrderItem),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function buildListWhere(query: ListOrdersQuery) {
  return {
    storeId: query.storeId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.customerId ? { customerId: query.customerId } : {}),
  };
}

const itemsInclude = {
  orderBy: { createdAt: "asc" as const },
};

export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(storeId: string, id: string): Promise<Order | null> {
    const record = await this.db.order.findFirst({
      where: { id, storeId },
      include: { items: itemsInclude },
    });

    return record ? toOrder(record) : null;
  }

  async list(query: ListOrdersQuery) {
    const where = buildListWhere(query);
    const skip = (query.page - 1) * query.limit;

    const [records, total] = await Promise.all([
      this.db.order.findMany({
        where,
        include: { items: itemsInclude },
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit,
      }),
      this.db.order.count({ where }),
    ]);

    return buildCatalogueListResult({
      items: records.map(toOrder),
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async create(record: CreateOrderRecord): Promise<Order> {
    for (let attempt = 0; attempt < MAX_ORDER_NUMBER_ATTEMPTS; attempt += 1) {
      const orderNumber = generateOrderNumber();

      try {
        const created = await this.db.$transaction(async (tx) => {
          return tx.order.create({
            data: {
              storeId: record.storeId,
              customerId: record.customerId,
              orderNumber,
              status: record.status,
              subtotal: record.subtotal,
              currency: record.currency,
              items: {
                create: record.items.map((item) => ({
                  productVariantId: item.productVariantId,
                  productName: item.productName,
                  sku: item.sku,
                  unitPrice: item.unitPrice,
                  currency: item.currency,
                  quantity: item.quantity,
                  lineSubtotal: item.lineSubtotal,
                })),
              },
            },
            include: { items: itemsInclude },
          });
        });

        return toOrder(created);
      } catch (error) {
        if (isUniqueOrderNumberViolation(error) && attempt < MAX_ORDER_NUMBER_ATTEMPTS - 1) {
          continue;
        }

        throw error;
      }
    }

    throw new Error("Unable to generate a unique order number");
  }
}
