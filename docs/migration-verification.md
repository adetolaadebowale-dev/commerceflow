# Migration Verification

Date: 2026-07-20  
Sprint: 15.2 — Database Integrity & Migration Stability  
Scope: Soft-delete partial unique indexes; Prisma schema alignment with migration SQL.

## Soft-delete uniqueness strategy

PostgreSQL **partial unique indexes** (`WHERE deleted_at IS NULL`) enforce uniqueness only among active rows. Soft-deleted business keys (slug, sku, code, email, membership) can be reused.

Prisma **6.x** cannot declare partial unique indexes in `schema.prisma` (`partialIndexes` requires Prisma 7.4+). Therefore:

1. Uniqueness lives in migration SQL.
2. Matching `@unique` / `@@unique` attributes are **omitted** from the Prisma schema so `migrate` / `db push` do not recreate hard uniques.
3. Model docs in `schema.prisma` name the partial index for operators.

Do **not** re-add hard `@@unique` on soft-deleted business keys without converting to a partial index migration.

## Migration added in 15.2

`20250720210000_soft_delete_active_partial_uniques`

Converts hard uniques → active partial uniques for:

| Table | Index |
|-------|--------|
| `users` | `users_email_active_key` |
| `organizations` | `organizations_slug_active_key` |
| `stores` | `stores_organization_id_slug_active_key` |
| `store_members` | `store_members_store_id_user_id_active_key` |
| `categories` | `categories_store_id_slug_active_key` |
| `products` | `products_store_id_slug_active_key` |
| `product_variants` | `product_variants_store_id_sku_active_key` |
| `warehouses` | `warehouses_store_id_code_active_key` |
| `inventory_items` | `inventory_items_store_warehouse_variant_active_key` |
| `suppliers` | `suppliers_store_id_code_active_key` |

Already present from earlier migrations (schema docs only in 15.2):

- `brands_store_id_slug_active_key`
- `customers_store_id_email_active_key`
- `customer_addresses_one_default_per_customer`
- `promotions_store_id_code_active_key`
- `tax_rates_store_id_active_key`
- Cart / FeatureFlag status-or-scope partial uniques (no `deletedAt`)

## Fresh database verification

```bash
# Create empty DB (Windows example)
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -c "DROP DATABASE IF EXISTS commerceflow_sprint152;"
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -c "CREATE DATABASE commerceflow_sprint152;"

# Apply all migrations + seed
cd apps/api
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/commerceflow_sprint152?schema=public"
pnpm exec prisma validate
pnpm exec prisma generate
pnpm exec prisma migrate deploy
pnpm db:seed
```

Expected: migrate deploy applies the full chain including `20250720210000_soft_delete_active_partial_uniques`; seed completes idempotently.

### Verification results (2026-07-20)

| Step | Result |
|------|--------|
| Fresh DB `commerceflow_sprint152` | Created |
| `prisma validate` / `generate` | Pass |
| `prisma migrate deploy` (56 migrations) | Pass |
| `db:seed` | Pass |
| Partial `*_active_key` indexes present | 14 indexes confirmed |
| `pnpm lint` / `typecheck` / `build` | Pass |
| `pnpm test` | 885 tests passed; intermittent Vitest worker teardown errors (`EnvironmentTeardownError`) may still fail the process exit code — unrelated to schema |

Existing shared databases (e.g. local `commerceflow`) still need `pnpm --filter api db:migrate` to pick up `20250720210000_soft_delete_active_partial_uniques`.

## Prisma Client + partial uniques

Because partial indexes are not modeled as Prisma `@unique` / `@@unique`:

- Prefer `findFirst` with `deletedAt: null` over `findUnique` / `upsert` on those business keys.
- Seed uses findFirst + create/update for user email and store membership.

## Operator notes

- Prefer `prisma migrate deploy` in production (never `db push` against prod).
- After pulling 15.2, run `pnpm --filter api db:migrate` on each environment.
- Store-scoped unique indexes keep `store_id` (or `organization_id` for stores) so tenant isolation of keys is preserved.

## Remaining database limitations

- Cross-entity same-store FK enforcement is still application-layer (not DB CHECK/triggers).
- Warehouse “one default per store” remains app-enforced (`isDefault` is not a unique partial index).
- Some invoice snapshot FKs remain plain UUIDs without referential constraints.
- Prisma schema cannot encode partial uniques natively until Prisma 7.4+ `partialIndexes`.
