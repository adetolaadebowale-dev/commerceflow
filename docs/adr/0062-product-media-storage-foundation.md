# ADR 0062: Product Media Storage Foundation

## Status

Accepted

## Date

2026-07-19

## Context

Sprint 13.4 introduces Product Media: merchants upload product images that must be stored securely, scoped per store, and referenced from catalogue APIs. CommerceFlow already persists structured catalogue data in PostgreSQL via Prisma. Storing binary blobs in the database would couple backup size, replication cost, and query performance to media volume, and would force the API process to stream large payloads through the same transactional store used for inventory and orders.

Operators also need a local development path that does not require cloud credentials, while production will eventually use an S3-compatible object store.

## Decision

### Binary files are not stored in PostgreSQL

`ProductMedia` rows hold metadata only (`storageKey`, MIME type, size, dimensions, alt text, sort order). Binary content lives in object storage addressed by `storageKey`. Cascade delete on `Product` removes metadata rows; the service deletes the corresponding storage objects.

### Storage abstraction

Callers depend on a `StorageProvider` interface:

- `upload(...)`
- `delete(...)`
- `getPublicUrl(...)`

The catalogue product-media service writes metadata after a successful upload and derives `ProductMedia.url` from `getPublicUrl`. No route or repository imports a cloud SDK directly.

### Local development strategy

`LocalStorageProvider` writes files under `MEDIA_STORAGE_PATH` (default: `<repo>/.tmp/media`, outside package sources). `MEDIA_PUBLIC_BASE_URL` (or `PUBLIC_API_URL/media`) builds public URLs for admin/storefront consumers. Tests use `MemoryStorageProvider`.

Serving local files over HTTP is out of scope for this sprint; the public URL is a locator contract for later static serving or CDN mapping.

### Future S3-compatible providers

A future `S3StorageProvider` (or equivalent) will implement the same interface using bucket + key layout (`stores/{storeId}/products/{productId}/...`). Switching providers is an environment/configuration change; domain contracts and REST shapes remain stable.

## Consequences

### Positive

- Database stays lean and transactional.
- Storage backends can evolve without changing Product Media APIs or shared contracts.
- Local development works without cloud accounts.

### Negative

- Orphaned files are possible if storage delete fails after DB delete (best-effort cleanup).
- Local URLs are not automatically served until a static/media route or CDN is added.

### Out of scope (explicit)

- Admin Media UI
- Image resizing / CDN transforms
- Cloud provider implementation (S3, GCS, Azure Blob)
- Virus scanning and signed upload URLs
