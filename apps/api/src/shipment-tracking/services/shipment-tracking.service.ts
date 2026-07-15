import type { Shipment, ShipmentTrackingEvent } from "@commerceflow/types";
import type {
  CreateShipmentTrackingEventInput,
  ShipmentTrackingQuery,
} from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import {
  getShipmentRepository,
  type ShipmentRepository,
} from "@/shipments/repositories";
import { SHIPMENT_TRACKING_ERROR_CODES, ShipmentTrackingError } from "../errors";
import {
  getShipmentTrackingRepository,
  type ShipmentTrackingRepository,
} from "../repositories";

export interface ShipmentTrackingServiceDependencies {
  readonly shipmentTrackingRepository?: ShipmentTrackingRepository;
  readonly shipmentRepository?: ShipmentRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class ShipmentTrackingService {
  private readonly shipmentTrackingRepository: ShipmentTrackingRepository;
  private readonly shipmentRepository: ShipmentRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: ShipmentTrackingServiceDependencies = {}) {
    this.shipmentTrackingRepository =
      dependencies.shipmentTrackingRepository ??
      getShipmentTrackingRepository();
    this.shipmentRepository =
      dependencies.shipmentRepository ?? getShipmentRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async createTrackingEvent(
    storeId: string,
    shipmentId: string,
    input: CreateShipmentTrackingEventInput,
  ): Promise<ShipmentTrackingEvent> {
    const shipment = await this.requireShipment(storeId, shipmentId);

    try {
      const trackingEvent = await this.shipmentTrackingRepository.append({
        storeId,
        shipmentId,
        statusSnapshot: shipment.status,
        eventType: input.eventType,
        description: input.description,
        location: input.location,
        metadata: input.metadata,
      });

      this.domainEventPublisher.publishShipmentTrackingUpdated(
        shipment,
        trackingEvent,
      );

      return trackingEvent;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async listTrackingEvents(
    query: ShipmentTrackingQuery,
    shipmentId: string,
  ): Promise<readonly ShipmentTrackingEvent[]> {
    await this.requireShipment(query.storeId, shipmentId);

    return this.shipmentTrackingRepository.listByShipmentId(
      query.storeId,
      shipmentId,
    );
  }

  private async requireShipment(
    storeId: string,
    shipmentId: string,
  ): Promise<Shipment> {
    const shipment = await this.shipmentRepository.findById(storeId, shipmentId);

    if (!shipment) {
      throw new ShipmentTrackingError(
        SHIPMENT_TRACKING_ERROR_CODES.SHIPMENT_NOT_FOUND,
        "Shipment not found",
        404,
      );
    }

    return shipment;
  }

  private mapRepositoryError(error: unknown): ShipmentTrackingError {
    if (error instanceof ShipmentTrackingError) {
      return error;
    }

    return new ShipmentTrackingError(
      SHIPMENT_TRACKING_ERROR_CODES.TRANSACTION_FAILED,
      "Shipment tracking transaction failed",
      500,
    );
  }
}

export const shipmentTrackingService = new ShipmentTrackingService();
