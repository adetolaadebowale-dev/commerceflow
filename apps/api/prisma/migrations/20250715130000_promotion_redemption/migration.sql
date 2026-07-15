-- AlterTable
ALTER TABLE "orders" ADD COLUMN "discount_amount" DECIMAL(12,2),
ADD COLUMN "total" DECIMAL(12,2);

UPDATE "orders" SET "total" = "subtotal" WHERE "total" IS NULL;

ALTER TABLE "orders" ALTER COLUMN "total" SET NOT NULL;

-- CreateTable
CREATE TABLE "cart_promotions" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "cart_id" UUID NOT NULL,
    "promotion_id" UUID NOT NULL,
    "promotion_code_snapshot" TEXT NOT NULL,
    "promotion_type_snapshot" "PromotionType" NOT NULL,
    "promotion_value_snapshot" DECIMAL(12,2) NOT NULL,
    "discount_amount" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_applied_promotions" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "promotion_id" UUID NOT NULL,
    "promotion_code_snapshot" TEXT NOT NULL,
    "promotion_type_snapshot" "PromotionType" NOT NULL,
    "promotion_value_snapshot" DECIMAL(12,2) NOT NULL,
    "discount_amount" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_applied_promotions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cart_promotions_cart_id_key" ON "cart_promotions"("cart_id");

-- CreateIndex
CREATE INDEX "cart_promotions_store_id_idx" ON "cart_promotions"("store_id");

-- CreateIndex
CREATE INDEX "cart_promotions_cart_id_idx" ON "cart_promotions"("cart_id");

-- CreateIndex
CREATE INDEX "cart_promotions_promotion_id_idx" ON "cart_promotions"("promotion_id");

-- CreateIndex
CREATE INDEX "cart_promotions_store_id_cart_id_idx" ON "cart_promotions"("store_id", "cart_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_applied_promotions_order_id_key" ON "order_applied_promotions"("order_id");

-- CreateIndex
CREATE INDEX "order_applied_promotions_store_id_idx" ON "order_applied_promotions"("store_id");

-- CreateIndex
CREATE INDEX "order_applied_promotions_order_id_idx" ON "order_applied_promotions"("order_id");

-- CreateIndex
CREATE INDEX "order_applied_promotions_promotion_id_idx" ON "order_applied_promotions"("promotion_id");

-- AddForeignKey
ALTER TABLE "cart_promotions" ADD CONSTRAINT "cart_promotions_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_promotions" ADD CONSTRAINT "cart_promotions_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_promotions" ADD CONSTRAINT "cart_promotions_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_applied_promotions" ADD CONSTRAINT "order_applied_promotions_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_applied_promotions" ADD CONSTRAINT "order_applied_promotions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_applied_promotions" ADD CONSTRAINT "order_applied_promotions_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
