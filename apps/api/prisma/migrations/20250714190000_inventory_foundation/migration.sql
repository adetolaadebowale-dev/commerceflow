-- CreateEnum
CREATE TYPE "StockMovementReason" AS ENUM ('initial', 'manual_adjustment', 'sale_reserved_ready');

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "product_variant_id" UUID NOT NULL,
    "quantity_on_hand" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "inventory_item_id" UUID NOT NULL,
    "product_variant_id" UUID NOT NULL,
    "quantity_change" INTEGER NOT NULL,
    "quantity_after" INTEGER NOT NULL,
    "reason" "StockMovementReason" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_product_variant_id_key" ON "inventory_items"("product_variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_store_id_product_variant_id_key" ON "inventory_items"("store_id", "product_variant_id");

-- CreateIndex
CREATE INDEX "inventory_items_store_id_idx" ON "inventory_items"("store_id");

-- CreateIndex
CREATE INDEX "inventory_items_deleted_at_idx" ON "inventory_items"("deleted_at");

-- CreateIndex
CREATE INDEX "inventory_items_store_id_deleted_at_idx" ON "inventory_items"("store_id", "deleted_at");

-- CreateIndex
CREATE INDEX "stock_movements_store_id_idx" ON "stock_movements"("store_id");

-- CreateIndex
CREATE INDEX "stock_movements_inventory_item_id_idx" ON "stock_movements"("inventory_item_id");

-- CreateIndex
CREATE INDEX "stock_movements_product_variant_id_idx" ON "stock_movements"("product_variant_id");

-- CreateIndex
CREATE INDEX "stock_movements_store_id_inventory_item_id_idx" ON "stock_movements"("store_id", "inventory_item_id");

-- CreateIndex
CREATE INDEX "stock_movements_store_id_product_variant_id_idx" ON "stock_movements"("store_id", "product_variant_id");

-- CreateIndex
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements"("created_at");

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
