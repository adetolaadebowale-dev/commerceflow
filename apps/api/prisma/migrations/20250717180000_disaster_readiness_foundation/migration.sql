-- AlterTable
ALTER TABLE "platform_configurations" ADD COLUMN "backup_configuration" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "platform_configurations" ADD COLUMN "recovery_objectives" JSONB NOT NULL DEFAULT '{}';
