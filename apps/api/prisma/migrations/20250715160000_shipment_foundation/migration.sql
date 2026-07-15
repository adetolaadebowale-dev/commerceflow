-- Sprint 7.2: shipment foundation

CREATE TYPE "ShipmentStatus" AS ENUM ('pending', 'packed', 'shipped', 'delivered', 'cancelled');
CREATE TYPE "ShipmentCarrier" AS ENUM ('internal', 'manual');

CREATE TABLE "shipments" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "shipment_number" TEXT NOT NULL,
    "carrier" "ShipmentCarrier" NOT NULL,
    "tracking_number" TEXT,
    "shipping_recipient_name" TEXT NOT NULL,
    "shipping_phone" TEXT NOT NULL,
    "shipping_address_line1" TEXT NOT NULL,
    "shipping_address_line2" TEXT,
    "shipping_city" TEXT NOT NULL,
    "shipping_state_province" TEXT NOT NULL,
    "shipping_postal_code" TEXT NOT NULL,
    "shipping_country_code" CHAR(2) NOT NULL,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'pending',
    "shipped_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "shipments_store_id_shipment_number_key" ON "shipments"("store_id", "shipment_number");
CREATE UNIQUE INDEX "shipments_store_id_order_id_key" ON "shipments"("store_id", "order_id");
CREATE INDEX "shipments_store_id_idx" ON "shipments"("store_id");
CREATE INDEX "shipments_order_id_idx" ON "shipments"("order_id");
CREATE INDEX "shipments_store_id_order_id_idx" ON "shipments"("store_id", "order_id");
CREATE INDEX "shipments_status_idx" ON "shipments"("status");
CREATE INDEX "shipments_store_id_status_idx" ON "shipments"("store_id", "status");

ALTER TABLE "shipments" ADD CONSTRAINT "shipments_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
