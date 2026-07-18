# CommerceFlow Deployment Guide

Provider-agnostic guidance for deploying the CommerceFlow API (backend v1.0).
This document does not cover cloud-specific services, containers, or CI/CD platforms.

Related:

- Environment template: [`.env.example`](../.env.example)
- Migration verification: [migration-verification.md](./migration-verification.md)
- Deployment readiness ADR: [ADR 0061](./adr/0061-deployment-release-readiness.md)

---

## Prerequisites

- Node.js **24.15.0** (see `.nvmrc`)
- pnpm **11.10.0** (see root `packageManager`)
- PostgreSQL compatible with the Prisma schema (`provider = postgresql`)
- Ability to set process environment variables for the API runtime

---

## Environment variables

Copy [`.env.example`](../.env.example) and supply production values.

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Prisma datasource |
| `NODE_ENV` | Yes | Use `production` |
| `PORT` | Recommended | Defaults depend on process manager / Next.js |
| `AUTH_JWT_SECRET` | Yes | Signs access and refresh tokens |
| `JWT_ACCESS_SECRET` | Yes (diagnostics) | Required by deployment/security readiness checks |
| `JWT_REFRESH_SECRET` | Yes (diagnostics) | Required by deployment/security readiness checks |
| `APP_URL` / `PUBLIC_API_URL` | Recommended | HTTPS readiness checks for staging/production |
| `LOG_LEVEL` | Optional | Prefer `info` or `warn` in production |
| `BUILD_ID` | Optional | Surfaced in release metadata |

Never commit populated `.env` files or real credentials.

---

## Build steps

From the repository root:

```bash
pnpm install
pnpm --filter @commerceflow/types build
pnpm --filter @commerceflow/validation build
pnpm --filter @commerceflow/api-client build
pnpm --filter api build
```

Or build the whole monorepo:

```bash
pnpm install
pnpm build
```

`api` build runs `prisma generate` then `next build`.

---

## Migration steps

Migrations live under `apps/api/prisma/migrations`. Apply with deploy (not `migrate dev`) in production:

```bash
pnpm --filter api db:migrate
```

Equivalent:

```bash
pnpm --filter api exec prisma migrate deploy
```

Before first deploy to a new database:

1. Ensure `DATABASE_URL` points at the target database.
2. Run `prisma migrate deploy`.
3. Optionally seed non-production data with `pnpm --filter api db:seed` (do not seed production unless intentional).

Do not edit historical migration SQL files.

---

## Production startup

```bash
pnpm --filter api start
```

This runs `next start` for the API app. Bind `PORT` (and host) via your process manager.

Ensure:

- `NODE_ENV=production`
- `DATABASE_URL` is reachable from the runtime host
- JWT secrets are set to strong unique values
- Public URL uses HTTPS when deployment readiness requires it

---

## Post-deployment verification

1. **Process health**
   - `GET /api/platform/live`
   - `GET /api/platform/ready`
   - `GET /api/platform/health`

2. **Release / environment readiness** (requires `platform:read`)
   - `GET /api/platform/release?storeId=<uuid>`
   - `GET /api/platform/environment?storeId=<uuid>`
   - `GET /api/platform/deployment?storeId=<uuid>`
   - `GET /api/platform/deployment/checklist?storeId=<uuid>`

3. **Quality gates (pre-release)**
   - `pnpm test`
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm build`

4. **Auth smoke check**
   - Register/login against `/api/auth/*` and confirm tokens verify with the configured secret.

---

## Rollback guidance

1. **Application rollback**
   - Redeploy the previous known-good API build artifact / release tag.
   - Keep the previous `BUILD_ID` (if used) for auditability.

2. **Database rollback**
   - Prefer forward-fix migrations.
   - Do not delete applied migrations from history.
   - If a destructive migration must be reversed, restore from a verified backup (see disaster-readiness / backup verification APIs) and re-apply a known-good migration set.

3. **Configuration rollback**
   - Revert environment variable changes independently of code when the failure is config-only.
   - Re-check `/api/platform/environment` after secret/URL changes.

---

## Troubleshooting

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| Prisma P1001 / connection errors | Database unreachable or bad `DATABASE_URL` | Verify host, port, credentials, network, SSL mode |
| Tokens invalid after deploy | `AUTH_JWT_SECRET` changed or missing | Restore prior secret or force re-login after intentional rotation |
| Deployment readiness blocked | Missing `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`, HTTP public URL, or Node version | Align env with `.env.example` and checklist |
| Schema drift concerns | Manual DB edits outside migrations | Compare schema with migrations; restore from backup if needed |
| Build fails on generate | Prisma client out of date | Run `pnpm --filter api db:generate` then rebuild |

For operational diagnostics without redeploying:

- `/api/platform/diagnostics`
- `/api/platform/database/diagnostics`
- `/api/platform/deployment`
