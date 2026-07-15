-- Sprint 8.2: inventory adjustments and cycle counting foundation

CREATE TYPE "CycleCountStatus" AS ENUM ('draft', 'counting', 'completed', 'approved');

CREATE TABLE "inventory_adjustments" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "inventory_item_id" UUID NOT NULL,
    "adjustment_number" TEXT NOT NULL,
    "movement_quantity" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "previous_quantity_on_hand" INTEGER NOT NULL,
    "new_quantity_on_hand" INTEGER NOT NULL,
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_adjustments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cycle_counts" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "cycle_count_number" TEXT NOT NULL,
    "status" "CycleCountStatus" NOT NULL DEFAULT 'draft',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cycle_counts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cycle_count_items" (
    "id" UUID NOT NULL,
    "cycle_count_id" UUID NOT NULL,
    "inventory_item_id" UUID NOT NULL,
    "expected_quantity" INTEGER NOT NULL,
    "counted_quantity" INTEGER NOT NULL DEFAULT 0,
    "variance" INTEGER NOT NULL DEFAULT 0,
    "adjustment_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cycle_count_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "inventory_adjustments_store_id_adjustment_number_key" ON "inventory_adjustments"("store_id", "adjustment_number");
CREATE INDEX "inventory_adjustments_store_id_idx" ON "inventory_adjustments"("store_id");
CREATE INDEX "inventory_adjustments_inventory_item_id_idx" ON "inventory_adjustments"("inventory_item_id");
CREATE INDEX "inventory_adjustments_store_id_inventory_item_id_idx" ON "inventory_adjustments"("store_id", "inventory_item_id");
CREATE INDEX "inventory_adjustments_created_at_idx" ON "inventory_adjustments"("created_at");

CREATE UNIQUE INDEX "cycle_counts_store_id_cycle_count_number_key" ON "cycle_counts"("store_id", "cycle_count_number");
CREATE INDEX "cycle_counts_store_id_idx" ON "cycle_counts"("store_id");
CREATE INDEX "cycle_counts_status_idx" ON "cycle_counts"("status");
CREATE INDEX "cycle_counts_store_id_status_idx" ON "cycle_counts"("store_id", "status");

CREATE INDEX "cycle_count_items_cycle_count_id_idx" ON "cycle_count_items"("cycle_count_id");
CREATE INDEX "cycle_count_items_inventory_item_id_idx" ON "cycle_count_items"("inventory_item_id");
CREATE INDEX "cycle_count_items_adjustment_id_idx" ON "cycle_count_items"("adjustment_id");

ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "cycle_counts" ADD CONSTRAINT "cycle_counts_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "cycle_count_items" ADD CONSTRAINT "cycle_count_items_cycle_count_id_fkey" FOREIGN KEY ("cycle_count_id") REFERENCES "cycle_counts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cycle_count_items" ADD CONSTRAINT "cycle_count_items_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cycle_count_items" ADD CONSTRAINT "cycle_count_items_adjustment_id_fkey" FOREIGN KEY ("adjustment_id") REFERENCES "inventory_adjustments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
