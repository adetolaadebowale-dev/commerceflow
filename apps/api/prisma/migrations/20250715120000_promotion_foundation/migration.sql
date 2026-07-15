-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('percentage', 'fixed_amount');

-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('draft', 'active', 'inactive', 'expired');

-- CreateTable
CREATE TABLE "promotions" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "type" "PromotionType" NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "currency" CHAR(3),
    "status" "PromotionStatus" NOT NULL DEFAULT 'draft',
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "promotions_store_id_idx" ON "promotions"("store_id");

-- CreateIndex
CREATE INDEX "promotions_status_idx" ON "promotions"("status");

-- CreateIndex
CREATE INDEX "promotions_store_id_status_idx" ON "promotions"("store_id", "status");

-- CreateIndex
CREATE INDEX "promotions_deleted_at_idx" ON "promotions"("deleted_at");

-- CreateIndex
CREATE INDEX "promotions_store_id_deleted_at_idx" ON "promotions"("store_id", "deleted_at");

-- Enforce code uniqueness only among active, non-deleted promotions per store.
CREATE UNIQUE INDEX "promotions_store_id_code_active_key"
  ON "promotions"("store_id", "code")
  WHERE "status" = 'active' AND "deleted_at" IS NULL;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
