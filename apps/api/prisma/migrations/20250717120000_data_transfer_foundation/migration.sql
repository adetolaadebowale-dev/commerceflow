-- CreateEnum
CREATE TYPE "DataTransferType" AS ENUM ('customers', 'products', 'inventory');

-- CreateEnum
CREATE TYPE "DataTransferStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "DataTransferFormat" AS ENUM ('csv');

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "type" "DataTransferType" NOT NULL,
    "status" "DataTransferStatus" NOT NULL DEFAULT 'pending',
    "format" "DataTransferFormat" NOT NULL DEFAULT 'csv',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "completed_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_jobs" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "type" "DataTransferType" NOT NULL,
    "status" "DataTransferStatus" NOT NULL DEFAULT 'pending',
    "format" "DataTransferFormat" NOT NULL DEFAULT 'csv',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "completed_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "export_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "import_jobs_store_id_idx" ON "import_jobs"("store_id");

-- CreateIndex
CREATE INDEX "import_jobs_store_id_status_idx" ON "import_jobs"("store_id", "status");

-- CreateIndex
CREATE INDEX "import_jobs_store_id_type_idx" ON "import_jobs"("store_id", "type");

-- CreateIndex
CREATE INDEX "import_jobs_created_at_idx" ON "import_jobs"("created_at");

-- CreateIndex
CREATE INDEX "export_jobs_store_id_idx" ON "export_jobs"("store_id");

-- CreateIndex
CREATE INDEX "export_jobs_store_id_status_idx" ON "export_jobs"("store_id", "status");

-- CreateIndex
CREATE INDEX "export_jobs_store_id_type_idx" ON "export_jobs"("store_id", "type");

-- CreateIndex
CREATE INDEX "export_jobs_created_at_idx" ON "export_jobs"("created_at");

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
