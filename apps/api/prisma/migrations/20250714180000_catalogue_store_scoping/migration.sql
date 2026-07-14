-- Drop global uniqueness; catalogue entities are scoped per store.
DROP INDEX IF EXISTS "brands_slug_key";
DROP INDEX IF EXISTS "categories_slug_key";
DROP INDEX IF EXISTS "products_slug_key";
DROP INDEX IF EXISTS "product_variants_sku_key";

ALTER TABLE "brands" ADD COLUMN "store_id" UUID NOT NULL;
ALTER TABLE "categories" ADD COLUMN "store_id" UUID NOT NULL;
ALTER TABLE "products" ADD COLUMN "store_id" UUID NOT NULL;
ALTER TABLE "product_variants" ADD COLUMN "store_id" UUID NOT NULL;

ALTER TABLE "brands"
  ADD CONSTRAINT "brands_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "categories"
  ADD CONSTRAINT "categories_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "products"
  ADD CONSTRAINT "products_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "product_variants"
  ADD CONSTRAINT "product_variants_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "brands_store_id_slug_key" ON "brands"("store_id", "slug");
CREATE UNIQUE INDEX "categories_store_id_slug_key" ON "categories"("store_id", "slug");
CREATE UNIQUE INDEX "products_store_id_slug_key" ON "products"("store_id", "slug");
CREATE UNIQUE INDEX "product_variants_store_id_sku_key" ON "product_variants"("store_id", "sku");

CREATE INDEX "brands_store_id_idx" ON "brands"("store_id");
CREATE INDEX "brands_store_id_deleted_at_idx" ON "brands"("store_id", "deleted_at");

CREATE INDEX "categories_store_id_idx" ON "categories"("store_id");
CREATE INDEX "categories_store_id_parent_id_idx" ON "categories"("store_id", "parent_id");
CREATE INDEX "categories_store_id_deleted_at_idx" ON "categories"("store_id", "deleted_at");

CREATE INDEX "products_store_id_idx" ON "products"("store_id");
CREATE INDEX "products_store_id_category_id_idx" ON "products"("store_id", "category_id");
CREATE INDEX "products_store_id_status_idx" ON "products"("store_id", "status");
CREATE INDEX "products_store_id_deleted_at_idx" ON "products"("store_id", "deleted_at");

CREATE INDEX "product_variants_store_id_idx" ON "product_variants"("store_id");
CREATE INDEX "product_variants_store_id_deleted_at_idx" ON "product_variants"("store_id", "deleted_at");
