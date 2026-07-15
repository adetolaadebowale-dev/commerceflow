-- Sprint 7.9: warehouse inventory allocation and shortage management

CREATE TYPE "InventoryAllocationStatus" AS ENUM ('allocated', 'partially_picked', 'picked', 'shortage');

CREATE TABLE "inventory_allocations" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "pick_list_item_id" UUID NOT NULL,
    "inventory_item_id" UUID NOT NULL,
    "quantity_allocated" INTEGER NOT NULL,
    "quantity_picked" INTEGER NOT NULL DEFAULT 0,
    "status" "InventoryAllocationStatus" NOT NULL DEFAULT 'allocated',
    "shortage_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_allocations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "inventory_allocations_store_id_idx" ON "inventory_allocations"("store_id");
CREATE INDEX "inventory_allocations_pick_list_item_id_idx" ON "inventory_allocations"("pick_list_item_id");
CREATE INDEX "inventory_allocations_inventory_item_id_idx" ON "inventory_allocations"("inventory_item_id");
CREATE INDEX "inventory_allocations_store_id_pick_list_item_id_idx" ON "inventory_allocations"("store_id", "pick_list_item_id");
CREATE INDEX "inventory_allocations_store_id_inventory_item_id_idx" ON "inventory_allocations"("store_id", "inventory_item_id");
CREATE INDEX "inventory_allocations_status_idx" ON "inventory_allocations"("status");

ALTER TABLE "inventory_allocations" ADD CONSTRAINT "inventory_allocations_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_allocations" ADD CONSTRAINT "inventory_allocations_pick_list_item_id_fkey" FOREIGN KEY ("pick_list_item_id") REFERENCES "pick_list_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_allocations" ADD CONSTRAINT "inventory_allocations_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
