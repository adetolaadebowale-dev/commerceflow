-- AlterTable
ALTER TABLE "platform_configurations" ADD COLUMN "cache_policies" JSONB NOT NULL DEFAULT '[]';
