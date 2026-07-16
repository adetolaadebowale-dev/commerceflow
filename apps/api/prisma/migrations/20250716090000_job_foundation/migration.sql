-- Sprint 10.4: Background jobs and scheduling foundation

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('pending', 'running', 'completed', 'failed');

-- CreateTable
CREATE TABLE "jobs" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'pending',
    "payload" JSONB NOT NULL,
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "jobs_store_id_idx" ON "jobs"("store_id");
CREATE INDEX "jobs_store_id_status_idx" ON "jobs"("store_id", "status");
CREATE INDEX "jobs_store_id_scheduled_for_idx" ON "jobs"("store_id", "scheduled_for");
CREATE INDEX "jobs_created_at_idx" ON "jobs"("created_at");

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
