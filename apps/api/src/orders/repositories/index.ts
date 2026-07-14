import { PrismaOrderRepository } from "./prisma-order.repository";
import { PrismaOrderVariantSnapshotReader } from "./prisma-order-variant-snapshot.reader";
import type { OrderRepository } from "./order.repository";
import type { OrderVariantSnapshotReader } from "./order-variant-snapshot.reader";
import { prisma } from "@/lib/prisma";

const orderRepository: OrderRepository = new PrismaOrderRepository(prisma);
const orderVariantSnapshotReader: OrderVariantSnapshotReader =
  new PrismaOrderVariantSnapshotReader(prisma);

export function getOrderRepository(): OrderRepository {
  return orderRepository;
}

export function getOrderVariantSnapshotReader(): OrderVariantSnapshotReader {
  return orderVariantSnapshotReader;
}

export type { OrderRepository } from "./order.repository";
export type { OrderVariantSnapshotReader } from "./order-variant-snapshot.reader";
export type {
  CreateOrderRecord,
  OrderVariantSnapshot,
  PreparedOrderItem,
} from "./order-create-record";
