-- CreateEnum
CREATE TYPE "PaymentTerm" AS ENUM ('immediate', 'net7', 'net15', 'net30', 'net60', 'custom');

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN "email" TEXT;
ALTER TABLE "suppliers" ADD COLUMN "phone" TEXT;
ALTER TABLE "suppliers" ADD COLUMN "website" TEXT;
ALTER TABLE "suppliers" ADD COLUMN "tax_id" TEXT;
ALTER TABLE "suppliers" ADD COLUMN "payment_term" "PaymentTerm" NOT NULL DEFAULT 'net30';
ALTER TABLE "suppliers" ADD COLUMN "currency" CHAR(3) NOT NULL DEFAULT 'USD';
ALTER TABLE "suppliers" ADD COLUMN "notes" TEXT;

-- CreateTable
CREATE TABLE "supplier_contacts" (
    "id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "supplier_contacts_supplier_id_idx" ON "supplier_contacts"("supplier_id");

-- CreateIndex
CREATE INDEX "supplier_contacts_supplier_id_is_primary_idx" ON "supplier_contacts"("supplier_id", "is_primary");

-- AddForeignKey
ALTER TABLE "supplier_contacts" ADD CONSTRAINT "supplier_contacts_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
