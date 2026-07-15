-- Sprint 7.8: warehouse picking and packing foundation

CREATE TYPE "PickListStatus" AS ENUM ('pending', 'picking', 'picked', 'packed');

CREATE TABLE "pick_lists" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "shipment_id" UUID NOT NULL,
    "status" "PickListStatus" NOT NULL DEFAULT 'pending',
    "assigned_to_user_id" UUID,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pick_lists_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pick_list_items" (
    "id" UUID NOT NULL,
    "pick_list_id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "quantity_required" INTEGER NOT NULL,
    "quantity_picked" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pick_list_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pick_lists_store_id_idx" ON "pick_lists"("store_id");
CREATE INDEX "pick_lists_shipment_id_idx" ON "pick_lists"("shipment_id");
CREATE INDEX "pick_lists_store_id_shipment_id_idx" ON "pick_lists"("store_id", "shipment_id");
CREATE INDEX "pick_lists_status_idx" ON "pick_lists"("status");
CREATE INDEX "pick_lists_store_id_status_idx" ON "pick_lists"("store_id", "status");

CREATE UNIQUE INDEX "pick_list_items_pick_list_id_order_item_id_key" ON "pick_list_items"("pick_list_id", "order_item_id");
CREATE INDEX "pick_list_items_pick_list_id_idx" ON "pick_list_items"("pick_list_id");
CREATE INDEX "pick_list_items_order_item_id_idx" ON "pick_list_items"("order_item_id");

ALTER TABLE "pick_lists" ADD CONSTRAINT "pick_lists_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pick_lists" ADD CONSTRAINT "pick_lists_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pick_list_items" ADD CONSTRAINT "pick_list_items_pick_list_id_fkey" FOREIGN KEY ("pick_list_id") REFERENCES "pick_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pick_list_items" ADD CONSTRAINT "pick_list_items_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
