CREATE TYPE "CustomerStatus" AS ENUM ('active', 'inactive');

CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "status" "CustomerStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "customers_store_id_idx" ON "customers"("store_id");
CREATE INDEX "customers_deleted_at_idx" ON "customers"("deleted_at");
CREATE INDEX "customers_store_id_deleted_at_idx" ON "customers"("store_id", "deleted_at");
CREATE INDEX "customers_store_id_status_idx" ON "customers"("store_id", "status");

CREATE UNIQUE INDEX "customers_store_id_email_active_key"
ON "customers"("store_id", "email")
WHERE "deleted_at" IS NULL;

ALTER TABLE "customers" ADD CONSTRAINT "customers_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
