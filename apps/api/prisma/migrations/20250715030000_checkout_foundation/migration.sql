ALTER TABLE "orders" ADD COLUMN "customer_profile_id" UUID;
ALTER TABLE "orders" ADD COLUMN "source_cart_id" UUID;
ALTER TABLE "orders" ADD COLUMN "shipping_recipient_name" TEXT;
ALTER TABLE "orders" ADD COLUMN "shipping_phone" TEXT;
ALTER TABLE "orders" ADD COLUMN "shipping_address_line1" TEXT;
ALTER TABLE "orders" ADD COLUMN "shipping_address_line2" TEXT;
ALTER TABLE "orders" ADD COLUMN "shipping_city" TEXT;
ALTER TABLE "orders" ADD COLUMN "shipping_state_province" TEXT;
ALTER TABLE "orders" ADD COLUMN "shipping_postal_code" TEXT;
ALTER TABLE "orders" ADD COLUMN "shipping_country_code" CHAR(2);

CREATE INDEX "orders_customer_profile_id_idx" ON "orders"("customer_profile_id");
CREATE INDEX "orders_source_cart_id_idx" ON "orders"("source_cart_id");

ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_profile_id_fkey" FOREIGN KEY ("customer_profile_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_source_cart_id_fkey" FOREIGN KEY ("source_cart_id") REFERENCES "carts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
