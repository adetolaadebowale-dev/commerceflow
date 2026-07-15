-- Sprint 8.0: shipment fulfillment and stock movement foundation

CREATE TYPE "StockMovementType" AS ENUM ('fulfillment', 'adjustment', 'return', 'transfer');

ALTER TABLE "stock_movements" ADD COLUMN "movement_type" "StockMovementType";
ALTER TABLE "stock_movements" ADD COLUMN "quantity" INTEGER;
ALTER TABLE "stock_movements" ADD COLUMN "previous_quantity_on_hand" INTEGER;
ALTER TABLE "stock_movements" ADD COLUMN "new_quantity_on_hand" INTEGER;
ALTER TABLE "stock_movements" ADD COLUMN "shipment_id" UUID;
ALTER TABLE "stock_movements" ADD COLUMN "inventory_allocation_id" UUID;
ALTER TABLE "stock_movements" ADD COLUMN "reference" TEXT;
ALTER TABLE "stock_movements" ADD COLUMN "metadata" JSONB;

UPDATE "stock_movements"
SET
  "movement_type" = CASE
    WHEN "reason" = 'sale_fulfilled' THEN 'fulfillment'::"StockMovementType"
    ELSE 'adjustment'::"StockMovementType"
  END,
  "quantity" = "quantity_change",
  "new_quantity_on_hand" = "quantity_after",
  "previous_quantity_on_hand" = "quantity_after" - "quantity_change";

ALTER TABLE "stock_movements" ALTER COLUMN "movement_type" SET NOT NULL;
ALTER TABLE "stock_movements" ALTER COLUMN "quantity" SET NOT NULL;
ALTER TABLE "stock_movements" ALTER COLUMN "previous_quantity_on_hand" SET NOT NULL;
ALTER TABLE "stock_movements" ALTER COLUMN "new_quantity_on_hand" SET NOT NULL;

ALTER TABLE "stock_movements" DROP COLUMN "quantity_change";
ALTER TABLE "stock_movements" DROP COLUMN "quantity_after";
ALTER TABLE "stock_movements" DROP COLUMN "reason";
ALTER TABLE "stock_movements" DROP COLUMN "product_variant_id";

DROP TYPE "StockMovementReason";

CREATE INDEX "stock_movements_shipment_id_idx" ON "stock_movements"("shipment_id");
CREATE INDEX "stock_movements_inventory_allocation_id_idx" ON "stock_movements"("inventory_allocation_id");
CREATE INDEX "stock_movements_store_id_shipment_id_idx" ON "stock_movements"("store_id", "shipment_id");
CREATE INDEX "stock_movements_movement_type_idx" ON "stock_movements"("movement_type");

ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_inventory_allocation_id_fkey" FOREIGN KEY ("inventory_allocation_id") REFERENCES "inventory_allocations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "shipments" ADD COLUMN "fulfilled_at" TIMESTAMP(3);

ALTER TYPE "InventoryAllocationStatus" ADD VALUE 'fulfilled';
