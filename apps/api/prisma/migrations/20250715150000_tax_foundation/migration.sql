-- Sprint 7.1: tax foundation

-- CreateEnum
CREATE TYPE "TaxRateStatus" AS ENUM ('active', 'inactive');

-- CreateTable
CREATE TABLE "tax_rates" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "status" "TaxRateStatus" NOT NULL DEFAULT 'inactive',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tax_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tax_rates_store_id_idx" ON "tax_rates"("store_id");
CREATE INDEX "tax_rates_status_idx" ON "tax_rates"("status");
CREATE INDEX "tax_rates_store_id_status_idx" ON "tax_rates"("store_id", "status");
CREATE INDEX "tax_rates_deleted_at_idx" ON "tax_rates"("deleted_at");
CREATE INDEX "tax_rates_store_id_deleted_at_idx" ON "tax_rates"("store_id", "deleted_at");

-- One active tax rate per store among non-deleted rows.
CREATE UNIQUE INDEX "tax_rates_store_id_active_key"
  ON "tax_rates"("store_id")
  WHERE "status" = 'active' AND "deleted_at" IS NULL;

-- AddForeignKey
ALTER TABLE "tax_rates" ADD CONSTRAINT "tax_rates_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Order tax amount
ALTER TABLE "orders" ADD COLUMN "tax_amount" DECIMAL(12, 2);

-- Invoice tax snapshot fields
ALTER TABLE "invoices" ADD COLUMN "tax_amount" DECIMAL(12, 2);
ALTER TABLE "invoices" ADD COLUMN "tax_rate_id" UUID;
ALTER TABLE "invoices" ADD COLUMN "tax_rate_name_snapshot" TEXT;
ALTER TABLE "invoices" ADD COLUMN "tax_rate_percentage_snapshot" DECIMAL(5, 2);

-- CreateTable
CREATE TABLE "order_applied_tax_rates" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "tax_rate_id" UUID NOT NULL,
    "name_snapshot" TEXT NOT NULL,
    "percentage_snapshot" DECIMAL(5,2) NOT NULL,
    "tax_amount" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_applied_tax_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_applied_tax_rates_order_id_key" ON "order_applied_tax_rates"("order_id");
CREATE INDEX "order_applied_tax_rates_store_id_idx" ON "order_applied_tax_rates"("store_id");
CREATE INDEX "order_applied_tax_rates_order_id_idx" ON "order_applied_tax_rates"("order_id");
CREATE INDEX "order_applied_tax_rates_tax_rate_id_idx" ON "order_applied_tax_rates"("tax_rate_id");

-- AddForeignKey
ALTER TABLE "order_applied_tax_rates" ADD CONSTRAINT "order_applied_tax_rates_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "order_applied_tax_rates" ADD CONSTRAINT "order_applied_tax_rates_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_applied_tax_rates" ADD CONSTRAINT "order_applied_tax_rates_tax_rate_id_fkey" FOREIGN KEY ("tax_rate_id") REFERENCES "tax_rates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
