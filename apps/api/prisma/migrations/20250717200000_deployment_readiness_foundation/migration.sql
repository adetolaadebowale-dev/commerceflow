-- AlterTable
ALTER TABLE "platform_configurations" ADD COLUMN "deployment_configuration" JSONB NOT NULL DEFAULT '{}';
