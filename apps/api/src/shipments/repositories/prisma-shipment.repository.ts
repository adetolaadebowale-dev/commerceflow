import {
  type Shipment as PrismaShipment,
  type PrismaClient,
} from "@prisma/client";
import type { Shipment } from "@commerceflow/types";

import type { CreateShipmentRecord } from "./shipment-create-record";
import type { ShipmentStatusTransitionInput } from "./shipment-create-record";
import type { ShipmentRepository } from "./shipment.repository";
import {
  generateShipmentNumber,
  isUniqueShipmentNumberViolation,
} from "../services/shipment-number";

const MAX_SHIPMENT_NUMBER_ATTEMPTS = 5;

function toShipment(record: PrismaShipment): Shipment {
  return {
    id: record.id,
    storeId: record.storeId,
    orderId: record.orderId,
    shipmentNumber: record.shipmentNumber,
    carrier: record.carrier,
    trackingNumber: record.trackingNumber ?? undefined,
    shippingRecipientName: record.shippingRecipientName,
    shippingPhone: record.shippingPhone,
    shippingAddressLine1: record.shippingAddressLine1,
    shippingAddressLine2: record.shippingAddressLine2 ?? undefined,
    shippingCity: record.shippingCity,
    shippingStateProvince: record.shippingStateProvince,
    shippingPostalCode: record.shippingPostalCode,
    shippingCountryCode: record.shippingCountryCode,
    status: record.status,
    shippedAt: record.shippedAt?.toISOString(),
    deliveredAt: record.deliveredAt?.toISOString(),
    fulfilledAt: record.fulfilledAt?.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class PrismaShipmentRepository implements ShipmentRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(storeId: string, id: string): Promise<Shipment | null> {
    const record = await this.db.shipment.findFirst({
      where: { id, storeId },
    });

    return record ? toShipment(record) : null;
  }

  async findByOrderId(
    storeId: string,
    orderId: string,
  ): Promise<Shipment | null> {
    const record = await this.db.shipment.findFirst({
      where: { storeId, orderId },
    });

    return record ? toShipment(record) : null;
  }

  async listByOrderId(
    storeId: string,
    orderId: string,
  ): Promise<readonly Shipment[]> {
    const records = await this.db.shipment.findMany({
      where: { storeId, orderId },
      orderBy: { createdAt: "asc" },
    });

    return records.map(toShipment);
  }

  async listByStoreId(storeId: string): Promise<readonly Shipment[]> {
    const records = await this.db.shipment.findMany({
      where: { storeId },
      orderBy: { createdAt: "asc" },
    });

    return records.map(toShipment);
  }

  async create(record: CreateShipmentRecord): Promise<Shipment> {
    for (let attempt = 0; attempt < MAX_SHIPMENT_NUMBER_ATTEMPTS; attempt += 1) {
      const shipmentNumber = record.shipmentNumber ?? generateShipmentNumber();

      try {
        const created = await this.db.shipment.create({
          data: {
            storeId: record.storeId,
            orderId: record.orderId,
            shipmentNumber,
            carrier: record.carrier,
            trackingNumber: record.trackingNumber,
            shippingRecipientName: record.shippingRecipientName,
            shippingPhone: record.shippingPhone,
            shippingAddressLine1: record.shippingAddressLine1,
            shippingAddressLine2: record.shippingAddressLine2,
            shippingCity: record.shippingCity,
            shippingStateProvince: record.shippingStateProvince,
            shippingPostalCode: record.shippingPostalCode,
            shippingCountryCode: record.shippingCountryCode,
            status: "pending",
          },
        });

        return toShipment(created);
      } catch (error) {
        if (
          isUniqueShipmentNumberViolation(error) &&
          attempt < MAX_SHIPMENT_NUMBER_ATTEMPTS - 1
        ) {
          continue;
        }

        throw error;
      }
    }

    throw new Error("Unable to generate a unique shipment number");
  }

  async transitionStatus(
    storeId: string,
    id: string,
    transition: ShipmentStatusTransitionInput,
  ): Promise<Shipment> {
    return this.db.$transaction(async (tx) => {
      const updateData = {
        status: transition.toStatus,
        ...(transition.trackingNumber
          ? { trackingNumber: transition.trackingNumber }
          : {}),
        ...(transition.shippedAt
          ? { shippedAt: new Date(transition.shippedAt) }
          : transition.toStatus === "shipped"
            ? { shippedAt: new Date() }
            : {}),
        ...(transition.deliveredAt
          ? { deliveredAt: new Date(transition.deliveredAt) }
          : transition.toStatus === "delivered"
            ? { deliveredAt: new Date() }
            : {}),
      };

      const updated = await tx.shipment.updateMany({
        where: {
          id,
          storeId,
          status: transition.fromStatus,
        },
        data: updateData,
      });

      if (updated.count === 0) {
        const existing = await tx.shipment.findFirst({
          where: { id, storeId },
          select: { status: true },
        });

        if (!existing) {
          throw new Error(`Shipment not found: ${id}`);
        }

        throw new Error(
          `Shipment transition rejected: ${existing.status} -> ${transition.toStatus}`,
        );
      }

      const record = await tx.shipment.findFirstOrThrow({
        where: { id, storeId },
      });

      return toShipment(record);
    });
  }
}
