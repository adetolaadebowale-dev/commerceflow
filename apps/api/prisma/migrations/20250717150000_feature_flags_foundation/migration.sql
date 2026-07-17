-- CreateEnum
CREATE TYPE "FeatureFlagScope" AS ENUM ('platform', 'organization', 'store');

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" UUID NOT NULL,
    "organization_id" UUID,
    "store_id" UUID,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "scope" "FeatureFlagScope" NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feature_flags_scope_idx" ON "feature_flags"("scope");

-- CreateIndex
CREATE INDEX "feature_flags_organization_id_idx" ON "feature_flags"("organization_id");

-- CreateIndex
CREATE INDEX "feature_flags_store_id_idx" ON "feature_flags"("store_id");

-- CreateIndex
CREATE INDEX "feature_flags_key_idx" ON "feature_flags"("key");

-- Partial unique indexes: one active flag per scope/key combination
CREATE UNIQUE INDEX "feature_flags_platform_key_uq"
ON "feature_flags" ("key")
WHERE "scope" = 'platform';

CREATE UNIQUE INDEX "feature_flags_organization_key_uq"
ON "feature_flags" ("organization_id", "key")
WHERE "scope" = 'organization';

CREATE UNIQUE INDEX "feature_flags_store_key_uq"
ON "feature_flags" ("store_id", "key")
WHERE "scope" = 'store';

-- AddForeignKey
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
