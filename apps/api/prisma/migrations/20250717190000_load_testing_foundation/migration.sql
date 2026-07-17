-- AlterTable
ALTER TABLE "platform_configurations" ADD COLUMN "load_testing_configuration" JSONB NOT NULL DEFAULT '{}';
