-- Sprint 7.7: shipment packaging and multi-package foundation

CREATE TYPE "WeightUnit" AS ENUM ('kg', 'lb', 'g', 'oz');
CREATE TYPE "DimensionUnit" AS ENUM ('cm', 'in', 'm');

CREATE TABLE "shipment_packages" (
    "id" UUID NOT NULL,
    "shipment_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "package_number" TEXT NOT NULL,
    "weight" DECIMAL(12,3) NOT NULL,
    "weight_unit" "WeightUnit" NOT NULL,
    "length" DECIMAL(12,3) NOT NULL,
    "width" DECIMAL(12,3) NOT NULL,
    "height" DECIMAL(12,3) NOT NULL,
    "dimension_unit" "DimensionUnit" NOT NULL,
    "tracking_number" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipment_packages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "shipment_packages_store_id_package_number_key" ON "shipment_packages"("store_id", "package_number");
CREATE INDEX "shipment_packages_store_id_idx" ON "shipment_packages"("store_id");
CREATE INDEX "shipment_packages_shipment_id_idx" ON "shipment_packages"("shipment_id");
CREATE INDEX "shipment_packages_store_id_shipment_id_idx" ON "shipment_packages"("store_id", "shipment_id");

ALTER TABLE "shipment_packages" ADD CONSTRAINT "shipment_packages_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "shipment_packages" ADD CONSTRAINT "shipment_packages_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
