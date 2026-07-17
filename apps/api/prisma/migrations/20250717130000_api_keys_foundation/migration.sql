-- CreateTable
CREATE TABLE "api_keys" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "hashed_key" TEXT NOT NULL,
    "key_prefix" TEXT NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "last_used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_prefix_key" ON "api_keys"("key_prefix");

-- CreateIndex
CREATE INDEX "api_keys_store_id_idx" ON "api_keys"("store_id");

-- CreateIndex
CREATE INDEX "api_keys_store_id_revoked_at_idx" ON "api_keys"("store_id", "revoked_at");

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
