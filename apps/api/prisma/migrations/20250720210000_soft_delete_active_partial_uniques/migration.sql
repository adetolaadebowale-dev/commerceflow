-- Soft-delete active-row uniqueness (Sprint 15.2).
-- Prefer partial unique indexes WHERE deleted_at IS NULL so business keys can be
-- reused after soft-delete while active rows remain unique (store-scoped where applicable).
-- Prisma 6.x cannot declare partial unique indexes in schema.prisma; uniqueness is
-- enforced here in SQL. Matching @@unique / @unique attributes are removed from the
-- Prisma schema so migrate/db push will not recreate hard uniques.

-- users.email
DROP INDEX IF EXISTS "users_email_key";
CREATE UNIQUE INDEX "users_email_active_key"
  ON "users"("email")
  WHERE "deleted_at" IS NULL;

-- organizations.slug
DROP INDEX IF EXISTS "organizations_slug_key";
CREATE UNIQUE INDEX "organizations_slug_active_key"
  ON "organizations"("slug")
  WHERE "deleted_at" IS NULL;

-- stores (organization_id, slug)
DROP INDEX IF EXISTS "stores_organization_id_slug_key";
CREATE UNIQUE INDEX "stores_organization_id_slug_active_key"
  ON "stores"("organization_id", "slug")
  WHERE "deleted_at" IS NULL;

-- store_members (store_id, user_id)
DROP INDEX IF EXISTS "store_members_store_id_user_id_key";
CREATE UNIQUE INDEX "store_members_store_id_user_id_active_key"
  ON "store_members"("store_id", "user_id")
  WHERE "deleted_at" IS NULL;

-- categories (store_id, slug)
DROP INDEX IF EXISTS "categories_store_id_slug_key";
CREATE UNIQUE INDEX "categories_store_id_slug_active_key"
  ON "categories"("store_id", "slug")
  WHERE "deleted_at" IS NULL;

-- products (store_id, slug)
DROP INDEX IF EXISTS "products_store_id_slug_key";
CREATE UNIQUE INDEX "products_store_id_slug_active_key"
  ON "products"("store_id", "slug")
  WHERE "deleted_at" IS NULL;

-- product_variants (store_id, sku)
DROP INDEX IF EXISTS "product_variants_store_id_sku_key";
CREATE UNIQUE INDEX "product_variants_store_id_sku_active_key"
  ON "product_variants"("store_id", "sku")
  WHERE "deleted_at" IS NULL;

-- warehouses (store_id, code)
DROP INDEX IF EXISTS "warehouses_store_id_code_key";
CREATE UNIQUE INDEX "warehouses_store_id_code_active_key"
  ON "warehouses"("store_id", "code")
  WHERE "deleted_at" IS NULL;

-- inventory_items (store_id, warehouse_id, product_variant_id)
DROP INDEX IF EXISTS "inventory_items_store_id_warehouse_id_product_variant_id_key";
CREATE UNIQUE INDEX "inventory_items_store_warehouse_variant_active_key"
  ON "inventory_items"("store_id", "warehouse_id", "product_variant_id")
  WHERE "deleted_at" IS NULL;

-- suppliers (store_id, code)
DROP INDEX IF EXISTS "suppliers_store_id_code_key";
CREATE UNIQUE INDEX "suppliers_store_id_code_active_key"
  ON "suppliers"("store_id", "code")
  WHERE "deleted_at" IS NULL;
