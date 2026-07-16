import type { Shipment } from "@commerceflow/types";

import type { CreateShipmentRecord } from "./shipment-create-record";
import type { ShipmentStatusTransitionInput } from "./shipment-create-record";
import type { ShipmentRepository } from "./shipment.repository";
import { generateShipmentNumber } from "../services/shipment-number";

export class MemoryShipmentRepository implements ShipmentRepository {
  private readonly shipmentsById = new Map<string, Shipment>();
  private readonly shipmentNumbersByStore = new Map<string, Set<string>>();

  async findById(storeId: string, id: string): Promise<Shipment | null> {
    const shipment = this.shipmentsById.get(id);
    return shipment?.storeId === storeId ? shipment : null;
  }

  async findByOrderId(
    storeId: string,
    orderId: string,
  ): Promise<Shipment | null> {
    for (const shipment of this.shipmentsById.values()) {
      if (shipment.storeId === storeId && shipment.orderId === orderId) {
        return shipment;
      }
    }

    return null;
  }

  async listByOrderId(
    storeId: string,
    orderId: string,
  ): Promise<readonly Shipment[]> {
    const shipments = [...this.shipmentsById.values()].filter(
      (shipment) =>
        shipment.storeId === storeId && shipment.orderId === orderId,
    );

    return shipments.sort((left, right) =>
      left.createdAt.localeCompare(right.createdAt),
    );
  }

  async listByStoreId(storeId: string): Promise<readonly Shipment[]> {
    return [...this.shipmentsById.values()]
      .filter((shipment) => shipment.storeId === storeId)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  async create(record: CreateShipmentRecord): Promise<Shipment> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const existing = await this.findByOrderId(record.storeId, record.orderId);

      if (existing) {
        throw Object.assign(new Error("Unique constraint failed"), {
          code: "P2002",
        });
      }

      const shipmentNumber = record.shipmentNumber ?? generateShipmentNumber();
      const numbers =
        this.shipmentNumbersByStore.get(record.storeId) ?? new Set<string>();

      if (numbers.has(shipmentNumber)) {
        continue;
      }

      const now = new Date().toISOString();
      const shipment: Shipment = {
        id: crypto.randomUUID(),
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
        createdAt: now,
        updatedAt: now,
      };

      numbers.add(shipmentNumber);
      this.shipmentNumbersByStore.set(record.storeId, numbers);
      this.shipmentsById.set(shipment.id, shipment);
      return shipment;
    }

    throw new Error("Unable to generate a unique shipment number");
  }

  async transitionStatus(
    storeId: string,
    id: string,
    transition: ShipmentStatusTransitionInput,
  ): Promise<Shipment> {
    const shipment = this.shipmentsById.get(id);

    if (!shipment || shipment.storeId !== storeId) {
      throw new Error(`Shipment not found: ${id}`);
    }

    if (shipment.status !== transition.fromStatus) {
      throw new Error(
        `Shipment transition rejected: ${shipment.status} -> ${transition.toStatus}`,
      );
    }

    const now = new Date().toISOString();
    const updated: Shipment = {
      ...shipment,
      status: transition.toStatus,
      trackingNumber: transition.trackingNumber ?? shipment.trackingNumber,
      shippedAt:
        transition.toStatus === "shipped"
          ? transition.shippedAt ?? now
          : shipment.shippedAt,
      deliveredAt:
        transition.toStatus === "delivered"
          ? transition.deliveredAt ?? now
          : shipment.deliveredAt,
      updatedAt: now,
    };

    this.shipmentsById.set(id, updated);
    return updated;
  }

  async markWarehouseFulfilled(storeId: string, id: string): Promise<Shipment> {
    const shipment = await this.findById(storeId, id);

    if (!shipment) {
      throw new Error(`Shipment not found: ${id}`);
    }

    const now = new Date().toISOString();
    const updated: Shipment = {
      ...shipment,
      fulfilledAt: now,
      updatedAt: now,
    };

    this.shipmentsById.set(id, updated);
    return updated;
  }

  /** Test helper: insert a fully-formed shipment record. */
  seedShipment(shipment: Shipment): void {
    this.shipmentsById.set(shipment.id, shipment);
    const numbers =
      this.shipmentNumbersByStore.get(shipment.storeId) ?? new Set<string>();
    numbers.add(shipment.shipmentNumber);
    this.shipmentNumbersByStore.set(shipment.storeId, numbers);
  }
}
