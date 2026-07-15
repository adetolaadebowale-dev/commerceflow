-- Sprint 7.4: shipment tracking foundation

CREATE TYPE "ShipmentTrackingEventType" AS ENUM (
  'status_update',
  'location_update',
  'carrier_update',
  'delivery_attempt',
  'note',
  'exception'
);

CREATE TABLE "shipment_tracking_events" (
    "id" UUID NOT NULL,
    "shipment_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "status_snapshot" "ShipmentStatus" NOT NULL,
    "event_type" "ShipmentTrackingEventType" NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_tracking_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "shipment_tracking_events_shipment_id_idx" ON "shipment_tracking_events"("shipment_id");
CREATE INDEX "shipment_tracking_events_store_id_idx" ON "shipment_tracking_events"("store_id");
CREATE INDEX "shipment_tracking_events_store_id_shipment_id_idx" ON "shipment_tracking_events"("store_id", "shipment_id");
CREATE INDEX "shipment_tracking_events_created_at_idx" ON "shipment_tracking_events"("created_at");

ALTER TABLE "shipment_tracking_events" ADD CONSTRAINT "shipment_tracking_events_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "shipment_tracking_events" ADD CONSTRAINT "shipment_tracking_events_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
