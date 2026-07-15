-- Sprint 7.6: checkout shipping selection and rate resolution

ALTER TABLE "orders" ADD COLUMN "shipping_amount" DECIMAL(12,2);

ALTER TABLE "invoices" ADD COLUMN "shipping_amount" DECIMAL(12,2);
ALTER TABLE "invoices" ADD COLUMN "shipping_method_id" UUID;
ALTER TABLE "invoices" ADD COLUMN "shipping_zone_id" UUID;
ALTER TABLE "invoices" ADD COLUMN "shipping_method_name_snapshot" TEXT;
ALTER TABLE "invoices" ADD COLUMN "shipping_zone_name_snapshot" TEXT;
ALTER TABLE "invoices" ADD COLUMN "shipping_carrier_snapshot" "ShipmentCarrier";
ALTER TABLE "invoices" ADD COLUMN "shipping_flat_rate_snapshot" DECIMAL(12,2);
ALTER TABLE "invoices" ADD COLUMN "shipping_currency_snapshot" CHAR(3);

CREATE TABLE "order_applied_shipping_methods" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "shipping_method_id" UUID NOT NULL,
    "shipping_zone_id" UUID NOT NULL,
    "method_name_snapshot" TEXT NOT NULL,
    "zone_name_snapshot" TEXT NOT NULL,
    "carrier_snapshot" "ShipmentCarrier" NOT NULL,
    "flat_rate_snapshot" DECIMAL(12,2) NOT NULL,
    "currency_snapshot" CHAR(3) NOT NULL,
    "shipping_amount" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_applied_shipping_methods_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "order_applied_shipping_methods_order_id_key" ON "order_applied_shipping_methods"("order_id");
CREATE INDEX "order_applied_shipping_methods_store_id_idx" ON "order_applied_shipping_methods"("store_id");
CREATE INDEX "order_applied_shipping_methods_order_id_idx" ON "order_applied_shipping_methods"("order_id");
CREATE INDEX "order_applied_shipping_methods_shipping_method_id_idx" ON "order_applied_shipping_methods"("shipping_method_id");
CREATE INDEX "order_applied_shipping_methods_shipping_zone_id_idx" ON "order_applied_shipping_methods"("shipping_zone_id");

ALTER TABLE "order_applied_shipping_methods" ADD CONSTRAINT "order_applied_shipping_methods_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "order_applied_shipping_methods" ADD CONSTRAINT "order_applied_shipping_methods_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_applied_shipping_methods" ADD CONSTRAINT "order_applied_shipping_methods_shipping_method_id_fkey" FOREIGN KEY ("shipping_method_id") REFERENCES "shipping_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "order_applied_shipping_methods" ADD CONSTRAINT "order_applied_shipping_methods_shipping_zone_id_fkey" FOREIGN KEY ("shipping_zone_id") REFERENCES "shipping_zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
