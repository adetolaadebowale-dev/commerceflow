import { PrismaInventoryReservationRepository } from "./prisma-inventory-reservation.repository";
import type { InventoryReservationRepository } from "./inventory-reservation.repository";
import { prisma } from "@/lib/prisma";

const inventoryReservationRepository: InventoryReservationRepository =
  new PrismaInventoryReservationRepository(prisma);

export function getInventoryReservationRepository(): InventoryReservationRepository {
  return inventoryReservationRepository;
}

export type { InventoryReservationRepository } from "./inventory-reservation.repository";
export type {
  CreateOrderReservationsRecord,
  PendingReservationItem,
} from "./create-order-reservations-record";
