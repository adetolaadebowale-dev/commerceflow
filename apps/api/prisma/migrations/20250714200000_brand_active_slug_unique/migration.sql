-- Enforce slug uniqueness only among active (non-deleted) brands per store.
DROP INDEX IF EXISTS "brands_store_id_slug_key";

CREATE UNIQUE INDEX "brands_store_id_slug_active_key"
  ON "brands"("store_id", "slug")
  WHERE "deleted_at" IS NULL;
