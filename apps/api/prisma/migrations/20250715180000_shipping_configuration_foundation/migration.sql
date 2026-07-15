-- Sprint 7.5: shipping zones and shipping methods foundation

CREATE TYPE "ShippingZoneStatus" AS ENUM ('active', 'inactive');
CREATE TYPE "ShippingMethodStatus" AS ENUM ('active', 'inactive');

CREATE TABLE "shipping_zones" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "countries" TEXT[],
    "status" "ShippingZoneStatus" NOT NULL DEFAULT 'inactive',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "shipping_zones_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "shipping_methods" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "shipping_zone_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "carrier" "ShipmentCarrier" NOT NULL,
    "flat_rate" DECIMAL(12,2) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "status" "ShippingMethodStatus" NOT NULL DEFAULT 'inactive',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "shipping_methods_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "shipping_zones_store_id_idx" ON "shipping_zones"("store_id");
CREATE INDEX "shipping_zones_status_idx" ON "shipping_zones"("status");
CREATE INDEX "shipping_zones_store_id_status_idx" ON "shipping_zones"("store_id", "status");
CREATE INDEX "shipping_zones_deleted_at_idx" ON "shipping_zones"("deleted_at");
CREATE INDEX "shipping_zones_store_id_deleted_at_idx" ON "shipping_zones"("store_id", "deleted_at");

CREATE INDEX "shipping_methods_store_id_idx" ON "shipping_methods"("store_id");
CREATE INDEX "shipping_methods_shipping_zone_id_idx" ON "shipping_methods"("shipping_zone_id");
CREATE INDEX "shipping_methods_store_id_shipping_zone_id_idx" ON "shipping_methods"("store_id", "shipping_zone_id");
CREATE INDEX "shipping_methods_status_idx" ON "shipping_methods"("status");
CREATE INDEX "shipping_methods_store_id_status_idx" ON "shipping_methods"("store_id", "status");
CREATE INDEX "shipping_methods_deleted_at_idx" ON "shipping_methods"("deleted_at");
CREATE INDEX "shipping_methods_store_id_deleted_at_idx" ON "shipping_methods"("store_id", "deleted_at");

ALTER TABLE "shipping_zones" ADD CONSTRAINT "shipping_zones_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "shipping_methods" ADD CONSTRAINT "shipping_methods_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "shipping_methods" ADD CONSTRAINT "shipping_methods_shipping_zone_id_fkey" FOREIGN KEY ("shipping_zone_id") REFERENCES "shipping_zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
