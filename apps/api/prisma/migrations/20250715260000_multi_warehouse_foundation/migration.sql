-- Sprint 8.3: multi-warehouse foundation

CREATE TYPE "WarehouseStatus" AS ENUM ('active', 'inactive');

CREATE TABLE "warehouses" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state_province" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "country_code" CHAR(2) NOT NULL,
    "status" "WarehouseStatus" NOT NULL DEFAULT 'active',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "warehouses_store_id_code_key" ON "warehouses"("store_id", "code");
CREATE INDEX "warehouses_store_id_idx" ON "warehouses"("store_id");
CREATE INDEX "warehouses_status_idx" ON "warehouses"("status");
CREATE INDEX "warehouses_store_id_status_idx" ON "warehouses"("store_id", "status");
CREATE INDEX "warehouses_store_id_is_default_idx" ON "warehouses"("store_id", "is_default");
CREATE INDEX "warehouses_deleted_at_idx" ON "warehouses"("deleted_at");
CREATE INDEX "warehouses_store_id_deleted_at_idx" ON "warehouses"("store_id", "deleted_at");

ALTER TABLE "warehouses"
ADD CONSTRAINT "warehouses_store_id_fkey"
FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed a default warehouse per store
INSERT INTO "warehouses" (
    "id",
    "store_id",
    "name",
    "code",
    "address",
    "city",
    "state_province",
    "postal_code",
    "country_code",
    "status",
    "is_default",
    "created_at",
    "updated_at"
)
SELECT
    gen_random_uuid(),
    s.id,
    'Default Warehouse',
    'DEFAULT',
    'TBD',
    'TBD',
    'TBD',
    '00000',
    'US',
    'active',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "stores" s;

-- Inventory items: add warehouse reference
ALTER TABLE "inventory_items" ADD COLUMN "warehouse_id" UUID;

UPDATE "inventory_items" ii
SET "warehouse_id" = w.id
FROM "warehouses" w
WHERE w.store_id = ii.store_id
  AND w.is_default = true;

ALTER TABLE "inventory_items" ALTER COLUMN "warehouse_id" SET NOT NULL;

DROP INDEX IF EXISTS "inventory_items_product_variant_id_key";
DROP INDEX IF EXISTS "inventory_items_store_id_product_variant_id_key";

CREATE UNIQUE INDEX "inventory_items_store_id_warehouse_id_product_variant_id_key"
ON "inventory_items"("store_id", "warehouse_id", "product_variant_id");

CREATE INDEX "inventory_items_warehouse_id_idx" ON "inventory_items"("warehouse_id");
CREATE INDEX "inventory_items_store_id_warehouse_id_idx" ON "inventory_items"("store_id", "warehouse_id");

ALTER TABLE "inventory_items"
ADD CONSTRAINT "inventory_items_warehouse_id_fkey"
FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Stock movements
ALTER TABLE "stock_movements" ADD COLUMN "warehouse_id" UUID;

UPDATE "stock_movements" sm
SET "warehouse_id" = ii.warehouse_id
FROM "inventory_items" ii
WHERE sm.inventory_item_id = ii.id;

ALTER TABLE "stock_movements" ALTER COLUMN "warehouse_id" SET NOT NULL;

CREATE INDEX "stock_movements_warehouse_id_idx" ON "stock_movements"("warehouse_id");
CREATE INDEX "stock_movements_store_id_warehouse_id_idx" ON "stock_movements"("store_id", "warehouse_id");

ALTER TABLE "stock_movements"
ADD CONSTRAINT "stock_movements_warehouse_id_fkey"
FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Inventory allocations
ALTER TABLE "inventory_allocations" ADD COLUMN "warehouse_id" UUID;

UPDATE "inventory_allocations" ia
SET "warehouse_id" = ii.warehouse_id
FROM "inventory_items" ii
WHERE ia.inventory_item_id = ii.id;

ALTER TABLE "inventory_allocations" ALTER COLUMN "warehouse_id" SET NOT NULL;

CREATE INDEX "inventory_allocations_warehouse_id_idx" ON "inventory_allocations"("warehouse_id");

ALTER TABLE "inventory_allocations"
ADD CONSTRAINT "inventory_allocations_warehouse_id_fkey"
FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Inventory adjustments
ALTER TABLE "inventory_adjustments" ADD COLUMN "warehouse_id" UUID;

UPDATE "inventory_adjustments" ia
SET "warehouse_id" = ii.warehouse_id
FROM "inventory_items" ii
WHERE ia.inventory_item_id = ii.id;

ALTER TABLE "inventory_adjustments" ALTER COLUMN "warehouse_id" SET NOT NULL;

CREATE INDEX "inventory_adjustments_warehouse_id_idx" ON "inventory_adjustments"("warehouse_id");
CREATE INDEX "inventory_adjustments_store_id_warehouse_id_idx" ON "inventory_adjustments"("store_id", "warehouse_id");

ALTER TABLE "inventory_adjustments"
ADD CONSTRAINT "inventory_adjustments_warehouse_id_fkey"
FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Cycle counts
ALTER TABLE "cycle_counts" ADD COLUMN "warehouse_id" UUID;

UPDATE "cycle_counts" cc
SET "warehouse_id" = w.id
FROM "warehouses" w
WHERE w.store_id = cc.store_id
  AND w.is_default = true;

ALTER TABLE "cycle_counts" ALTER COLUMN "warehouse_id" SET NOT NULL;

CREATE INDEX "cycle_counts_warehouse_id_idx" ON "cycle_counts"("warehouse_id");
CREATE INDEX "cycle_counts_store_id_warehouse_id_idx" ON "cycle_counts"("store_id", "warehouse_id");

ALTER TABLE "cycle_counts"
ADD CONSTRAINT "cycle_counts_warehouse_id_fkey"
FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Shipments (optional assignment)
ALTER TABLE "shipments" ADD COLUMN "warehouse_id" UUID;

UPDATE "shipments" s
SET "warehouse_id" = w.id
FROM "warehouses" w
WHERE w.store_id = s.store_id
  AND w.is_default = true;

CREATE INDEX "shipments_warehouse_id_idx" ON "shipments"("warehouse_id");

ALTER TABLE "shipments"
ADD CONSTRAINT "shipments_warehouse_id_fkey"
FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
