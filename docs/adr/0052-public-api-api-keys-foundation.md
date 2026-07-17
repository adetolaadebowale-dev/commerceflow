# ADR 0052: Public API & API Keys Foundation

## Status

Accepted

## Date

2026-07-17

## Context

CommerceFlow needs a secure foundation for server-to-server integrations. User session JWTs are appropriate for interactive admin use but not for long-lived external system access. Sprint 11.3 introduces store-scoped API keys with permission scoping while reusing existing authorization and audit infrastructure.

OAuth, JWT issuance for API keys, rate limiting, usage analytics, and developer portals remain out of scope.

## Decision

### Module layout

API key management lives in `apps/api/src/api-keys/`:

```
api-keys/
├── repositories/       # Prisma + memory
├── services/           # ApiKeyService, ApiKeyAuthenticationService, crypto helpers
├── routes/             # REST handlers
├── errors/
└── testing/
```

Shared contracts:

- `packages/types/src/api-keys/` — `ApiKey`, `ApiKeyWithSecret`, `AuthorizedApiKeyContext`
- `packages/validation/src/api-keys/` — create, list, authenticate schemas
- `packages/api-client/src/api-keys/` — HTTP client

### Prisma model

`ApiKey` (`api_keys` table):

| Field | Purpose |
|-------|---------|
| `hashedKey` | scrypt hash of the full secret (never plaintext) |
| `keyPrefix` | Unique lookup prefix (`cfk_live_<12 chars>`) |
| `permissions` | JSON array of scoped `StorePermissionCode` values |
| `lastUsedAt` | Updated on successful authentication |
| `expiresAt` | Optional expiration |
| `revokedAt` | Set on revocation |

Plaintext keys use format `cfk_live_<base64url>` and are returned only in the create response.

### Key security

- Secrets hashed with the existing scrypt pattern from `password.service.ts`
- Prefix-based lookup followed by constant-time hash verification
- API keys cannot be assigned `api-keys:read` or `api-keys:write` permissions

### REST API (management)

| Method | Path | Permission | Role restriction |
|--------|------|------------|------------------|
| POST | `/api/api-keys` | `api-keys:write` | owner, admin |
| GET | `/api/api-keys` | `api-keys:read` | all roles |
| GET | `/api/api-keys/:id` | `api-keys:read` | all roles |
| POST | `/api/api-keys/:id/revoke` | `api-keys:write` | owner, admin |

Management endpoints require user session JWT authentication via `AuthorizationService.authorizeStoreRequest()`.

### API key authentication

`ApiKeyAuthenticationService.authenticateRequest()` / `authenticateToken()`:

1. Extract Bearer token
2. Validate `cfk_live_` prefix format
3. Lookup by `keyPrefix`
4. Verify scrypt hash
5. Reject revoked or expired keys
6. Check scoped permission
7. Record `lastUsedAt`

Returns `AuthorizedApiKeyContext` for downstream authorization.

### Domain events and audit

| Event | Aggregate |
|-------|-----------|
| `api-key.created` | api_key |
| `api-key.revoked` | api_key |

Audit entity: `api_key`. Actions: `create`, `revoke`.

## Consequences

### Positive

- External integrations can authenticate with scoped, revocable credentials.
- Secrets are never persisted in plaintext.
- Permission scoping reuses existing `StorePermissionCode` vocabulary.

### Negative

- API key auth is not yet wired into existing business route handlers; integration points are established via `ApiKeyAuthenticationService`.
- No rate limiting or usage analytics in this sprint.

### Out of scope (explicit)

- OAuth and OAuth clients
- JWT issuance and refresh tokens for API keys
- Rate limiting
- Usage analytics
- Developer portals
