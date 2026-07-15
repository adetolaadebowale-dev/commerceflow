-- CreateEnum
CREATE TYPE "ReplenishmentRecommendationStatus" AS ENUM ('pending', 'accepted', 'dismissed');

-- CreateTable
CREATE TABLE "replenishment_rules" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "product_variant_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "reorder_point" INTEGER NOT NULL,
    "reorder_quantity" INTEGER NOT NULL,
    "minimum_quantity" INTEGER,
    "maximum_quantity" INTEGER,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "replenishment_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "replenishment_recommendations" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "product_variant_id" UUID NOT NULL,
    "recommended_quantity" INTEGER NOT NULL,
    "current_quantity" INTEGER NOT NULL,
    "reorder_point" INTEGER NOT NULL,
    "status" "ReplenishmentRecommendationStatus" NOT NULL DEFAULT 'pending',
    "purchase_order_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "replenishment_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "replenishment_rules_store_id_idx" ON "replenishment_rules"("store_id");

-- CreateIndex
CREATE INDEX "replenishment_rules_warehouse_id_idx" ON "replenishment_rules"("warehouse_id");

-- CreateIndex
CREATE INDEX "replenishment_rules_supplier_id_idx" ON "replenishment_rules"("supplier_id");

-- CreateIndex
CREATE INDEX "replenishment_rules_store_id_is_enabled_idx" ON "replenishment_rules"("store_id", "is_enabled");

-- CreateIndex
CREATE INDEX "replenishment_rules_store_id_warehouse_id_is_enabled_idx" ON "replenishment_rules"("store_id", "warehouse_id", "is_enabled");

-- CreateIndex
CREATE UNIQUE INDEX "replenishment_rules_store_id_warehouse_id_product_variant_id_key" ON "replenishment_rules"("store_id", "warehouse_id", "product_variant_id");

-- CreateIndex
CREATE INDEX "replenishment_recommendations_store_id_idx" ON "replenishment_recommendations"("store_id");

-- CreateIndex
CREATE INDEX "replenishment_recommendations_warehouse_id_idx" ON "replenishment_recommendations"("warehouse_id");

-- CreateIndex
CREATE INDEX "replenishment_recommendations_supplier_id_idx" ON "replenishment_recommendations"("supplier_id");

-- CreateIndex
CREATE INDEX "replenishment_recommendations_product_variant_id_idx" ON "replenishment_recommendations"("product_variant_id");

-- CreateIndex
CREATE INDEX "replenishment_recommendations_status_idx" ON "replenishment_recommendations"("status");

-- CreateIndex
CREATE INDEX "replenishment_recommendations_store_id_status_idx" ON "replenishment_recommendations"("store_id", "status");

-- CreateIndex
CREATE INDEX "replenishment_recommendations_store_id_warehouse_id_product_variant_id_status_idx" ON "replenishment_recommendations"("store_id", "warehouse_id", "product_variant_id", "status");

-- CreateIndex
CREATE INDEX "replenishment_recommendations_purchase_order_id_idx" ON "replenishment_recommendations"("purchase_order_id");

-- AddForeignKey
ALTER TABLE "replenishment_rules" ADD CONSTRAINT "replenishment_rules_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replenishment_rules" ADD CONSTRAINT "replenishment_rules_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replenishment_rules" ADD CONSTRAINT "replenishment_rules_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replenishment_rules" ADD CONSTRAINT "replenishment_rules_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replenishment_recommendations" ADD CONSTRAINT "replenishment_recommendations_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replenishment_recommendations" ADD CONSTRAINT "replenishment_recommendations_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replenishment_recommendations" ADD CONSTRAINT "replenishment_recommendations_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replenishment_recommendations" ADD CONSTRAINT "replenishment_recommendations_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replenishment_recommendations" ADD CONSTRAINT "replenishment_recommendations_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
