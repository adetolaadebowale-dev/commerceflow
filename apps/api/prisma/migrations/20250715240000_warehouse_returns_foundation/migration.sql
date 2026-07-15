-- Sprint 8.1: warehouse returns foundation

CREATE TYPE "ReturnStatus" AS ENUM ('requested', 'received', 'inspecting', 'completed', 'rejected');

CREATE TYPE "ReturnCondition" AS ENUM ('new', 'opened', 'damaged', 'defective');

CREATE TABLE "returns" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "shipment_id" UUID NOT NULL,
    "return_number" TEXT NOT NULL,
    "status" "ReturnStatus" NOT NULL DEFAULT 'requested',
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL,
    "received_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "returns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "return_items" (
    "id" UUID NOT NULL,
    "return_id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "inventory_item_id" UUID NOT NULL,
    "quantity_requested" INTEGER NOT NULL,
    "quantity_received" INTEGER NOT NULL DEFAULT 0,
    "quantity_restocked" INTEGER NOT NULL DEFAULT 0,
    "condition" "ReturnCondition",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "return_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "returns_store_id_return_number_key" ON "returns"("store_id", "return_number");
CREATE INDEX "returns_store_id_idx" ON "returns"("store_id");
CREATE INDEX "returns_order_id_idx" ON "returns"("order_id");
CREATE INDEX "returns_shipment_id_idx" ON "returns"("shipment_id");
CREATE INDEX "returns_store_id_order_id_idx" ON "returns"("store_id", "order_id");
CREATE INDEX "returns_status_idx" ON "returns"("status");

CREATE INDEX "return_items_return_id_idx" ON "return_items"("return_id");
CREATE INDEX "return_items_order_item_id_idx" ON "return_items"("order_item_id");
CREATE INDEX "return_items_inventory_item_id_idx" ON "return_items"("inventory_item_id");

ALTER TABLE "returns" ADD CONSTRAINT "returns_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "returns" ADD CONSTRAINT "returns_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "returns" ADD CONSTRAINT "returns_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "return_items" ADD CONSTRAINT "return_items_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
