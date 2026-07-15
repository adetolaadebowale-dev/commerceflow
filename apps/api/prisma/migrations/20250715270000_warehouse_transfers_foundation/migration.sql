-- CreateEnum
CREATE TYPE "WarehouseTransferStatus" AS ENUM ('draft', 'approved', 'in_transit', 'received', 'cancelled');

-- CreateTable
CREATE TABLE "warehouse_transfers" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "transfer_number" TEXT NOT NULL,
    "source_warehouse_id" UUID NOT NULL,
    "destination_warehouse_id" UUID NOT NULL,
    "status" "WarehouseTransferStatus" NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "approved_at" TIMESTAMP(3),
    "shipped_at" TIMESTAMP(3),
    "received_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouse_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_transfer_items" (
    "id" UUID NOT NULL,
    "warehouse_transfer_id" UUID NOT NULL,
    "inventory_item_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouse_transfer_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "warehouse_transfers_store_id_idx" ON "warehouse_transfers"("store_id");

-- CreateIndex
CREATE INDEX "warehouse_transfers_source_warehouse_id_idx" ON "warehouse_transfers"("source_warehouse_id");

-- CreateIndex
CREATE INDEX "warehouse_transfers_destination_warehouse_id_idx" ON "warehouse_transfers"("destination_warehouse_id");

-- CreateIndex
CREATE INDEX "warehouse_transfers_status_idx" ON "warehouse_transfers"("status");

-- CreateIndex
CREATE INDEX "warehouse_transfers_store_id_status_idx" ON "warehouse_transfers"("store_id", "status");

-- CreateIndex
CREATE INDEX "warehouse_transfers_store_id_source_warehouse_id_idx" ON "warehouse_transfers"("store_id", "source_warehouse_id");

-- CreateIndex
CREATE INDEX "warehouse_transfers_store_id_destination_warehouse_id_idx" ON "warehouse_transfers"("store_id", "destination_warehouse_id");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_transfers_store_id_transfer_number_key" ON "warehouse_transfers"("store_id", "transfer_number");

-- CreateIndex
CREATE INDEX "warehouse_transfer_items_warehouse_transfer_id_idx" ON "warehouse_transfer_items"("warehouse_transfer_id");

-- CreateIndex
CREATE INDEX "warehouse_transfer_items_inventory_item_id_idx" ON "warehouse_transfer_items"("inventory_item_id");

-- AddForeignKey
ALTER TABLE "warehouse_transfers" ADD CONSTRAINT "warehouse_transfers_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_transfers" ADD CONSTRAINT "warehouse_transfers_source_warehouse_id_fkey" FOREIGN KEY ("source_warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_transfers" ADD CONSTRAINT "warehouse_transfers_destination_warehouse_id_fkey" FOREIGN KEY ("destination_warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_transfer_items" ADD CONSTRAINT "warehouse_transfer_items_warehouse_transfer_id_fkey" FOREIGN KEY ("warehouse_transfer_id") REFERENCES "warehouse_transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_transfer_items" ADD CONSTRAINT "warehouse_transfer_items_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
