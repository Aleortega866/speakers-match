# Plan: Railway Migration

**Generated**: 2026-03-17
**Estimated Complexity**: Low

## Overview

Migrate the deployment platform from Vercel to Railway. Four discrete changes:
1. Create `railway.toml` (build/deploy config)
2. Delete `vercel.json` (no longer needed)
3. Create `prisma/schema.prisma` (PostgreSQL dual-URL, 3 models)
4. Create `prisma/seed.ts` (idempotent seed from `lib/formData.ts`)

Then run the first Railway deploy via CLI. No changes to app code.

**Spec reference:** `docs/superpowers/specs/2026-03-17-railway-migration-design.md`

---

## Prerequisites

- Railway CLI installed: `npm install -g @railway/cli`
- Railway account and project created (or created during Sprint 3)
- Railway Postgres plugin added to the project
- `DATABASE_URL` and `DIRECT_URL` values copied from Railway dashboard to local `.env`

---

## Sprint 1: Archivos de Deploy

**Goal**: Replace Vercel config with Railway config. Codebase deployable to Railway after this sprint.

**Demo/Validation**:
- `railway.toml` exists at project root with correct keys
- `vercel.json` no longer exists in the repo
- `git status` shows the two changes cleanly

---

### Task 1.1: Crear `railway.toml`

- **Location**: `railway.toml` (project root)
- **Description**: Create Railway build/deploy configuration. Nixpacks auto-detects Next.js; `postinstall` handles `prisma generate`.
- **Dependencies**: None
- **Content**:
  ```toml
  [build]
  builder = "NIXPACKS"

  [deploy]
  startCommand = "npm start"
  healthcheckPath = "/"
  healthcheckTimeout = 30
  restartPolicyType = "ON_FAILURE"
  ```
- **Acceptance Criteria**:
  - File exists at root
  - All four `[deploy]` keys present
- **Validation**:
  - `cat railway.toml` shows correct content

---

### Task 1.2: Eliminar `vercel.json`

- **Location**: `vercel.json` (project root)
- **Description**: Delete the file. Railway uses Nixpacks — `buildCommand`, `devCommand`, `installCommand` are not needed.
- **Dependencies**: None (independent of Task 1.1)
- **Acceptance Criteria**:
  - `vercel.json` does not exist
- **Validation**:
  - `ls vercel.json` returns "No such file"

---

### Sprint 1 Commit

```bash
git add railway.toml
git rm vercel.json
git commit -m "chore: replace vercel.json with railway.toml"
```

---

## Sprint 2: Prisma Schema y Seed

**Goal**: Prisma schema and seed script ready. Database can be migrated and seeded from local.

**Demo/Validation**:
- `npx prisma validate` passes (requires `DATABASE_URL` in `.env`)
- `prisma/schema.prisma` has correct provider and dual-URL config
- `prisma/seed.ts` compiles without errors

---

### Task 2.1: Crear `prisma/schema.prisma`

- **Location**: `prisma/schema.prisma`
- **Description**: Create or overwrite with PostgreSQL dual-URL datasource and three models. If an incomplete version already exists, overwrite it entirely.
- **Dependencies**: None
- **Content**: Full schema from spec — generator, datasource with `DATABASE_URL` + `DIRECT_URL`, models `Contact`, `MatchStep`, `MatchStepOption`
- **Key details**:
  - `provider = "postgresql"`
  - `url = env("DATABASE_URL")`
  - `directUrl = env("DIRECT_URL")`
  - `Contact`: 14 fields, indexes on `[email]` and `[origen, form_started_at]`
  - `MatchStep`: 6 fields, index on `[active, orden]`
  - `MatchStepOption`: 6 fields, cascade delete, index on `[stepId, active, orden]`
- **Acceptance Criteria**:
  - `npx prisma validate` exits 0
  - `npx prisma format` produces no changes
- **Validation**:
  - `npx prisma validate`

---

### Task 2.2: Crear `prisma/seed.ts`

- **Location**: `prisma/seed.ts`
- **Description**: Idempotent seed that deletes all `MatchStepOption` and `MatchStep` rows then re-inserts from `lib/formData.ts`. Safe to run multiple times.
- **Dependencies**: Task 2.1 (schema must exist for `@prisma/client` types)
- **Key details**:
  - Delete order matters: `MatchStepOption` first, then `MatchStep` (FK constraint)
  - Import path: `"../lib/formData"` (relative from `prisma/`)
  - Uses `PrismaClient` directly (not the singleton from `lib/prisma.ts`)
- **Acceptance Criteria**:
  - File compiles: `npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts` exits 0 (requires live DB)
  - Running seed twice produces identical row counts (idempotent)
- **Validation**:
  - After seeding: `npx prisma studio` shows populated `MatchStep` and `MatchStepOption` tables

---

### Sprint 2 Commit

```bash
git add prisma/schema.prisma prisma/seed.ts
git commit -m "feat: add prisma schema (postgresql) and idempotent seed"
```

---

## Sprint 3: Setup Railway y Primer Deploy

**Goal**: App live on Railway, connected to Postgres, with migrated and seeded database.

**Demo/Validation**:
- `GET /` returns HTTP 200 at the Railway-provided URL
- Railway dashboard shows service as "Active"
- `npx prisma studio` (pointing to Railway DB) shows seeded data

---

### Task 3.1: Setup local `.env` con URLs de Railway

- **Location**: `.env` (local only, gitignored)
- **Description**: Copy Railway Postgres connection URLs to local `.env` for migration commands.
- **Dependencies**: Railway Postgres plugin must be added in dashboard first
- **Content**:
  ```
  DATABASE_URL="postgresql://..."   # from Railway dashboard
  DIRECT_URL="postgresql://..."     # same value as DATABASE_URL for Railway
  ```
- **Acceptance Criteria**:
  - `echo "SELECT 1;" | npx prisma db execute --stdin` exits 0
- **Validation**:
  - Command above confirms live connection

---

### Task 3.2: Correr primera migración

- **Location**: Terminal (local)
- **Description**: Create tables in Railway Postgres. **Use only on empty DB** — `migrate dev` is a dev-only command.
- **Dependencies**: Task 3.1 (`.env` with Railway URLs), Sprint 2 complete
- **Command**:
  ```bash
  npx prisma migrate dev --name init
  ```
- **Acceptance Criteria**:
  - Command exits 0
  - Migration file created at `prisma/migrations/*/migration.sql`
  - Three tables exist in Railway DB
- **Validation**:
  - `npx prisma migrate status` shows "Database schema is up to date"

---

### Task 3.3: Seed de la base de datos

- **Location**: Terminal (local)
- **Description**: Load MatchForm questions into Railway Postgres.
- **Dependencies**: Task 3.2
- **Command**:
  ```bash
  npx prisma db seed
  ```
- **Acceptance Criteria**:
  - Command exits 0
  - Running a second time produces no errors and no duplicates
- **Validation**:
  - `npx prisma studio` shows correct rows in `MatchStep` and `MatchStepOption`

---

### Task 3.4: Configurar variables de entorno en Railway dashboard

- **Location**: Railway dashboard → servicio Next.js → Variables
- **Description**: Set all required environment variables in Railway.
- **Dependencies**: None (can be done before or after Tasks 3.1-3.3)
- **Variables to set**:
  | Variable | Valor |
  |---|---|
  | `DIRECT_URL` | Mismo valor que `DATABASE_URL` (ya auto-inyectado) |
  | `ZAPIER_WEBHOOK_OUTREACH` | URL del Zap 1 |
  | `ZAPIER_WEBHOOK_FORM_STARTED` | URL del Zap 2 |
  | `ZAPIER_WEBHOOK_FORM_COMPLETED` | URL del Zap 3 |
  | `NEXT_PUBLIC_CALENDLY_URL` | URL del evento Calendly |
- **Acceptance Criteria**:
  - Todas las variables listadas existen en el dashboard
  - `DIRECT_URL` tiene valor (no está vacía)

---

### Task 3.5: Primer deploy via Railway CLI

- **Location**: Terminal (local)
- **Description**: Initialize Railway project (if not done) and deploy.
- **Dependencies**: Tasks 3.2, 3.3, 3.4 complete; Sprint 1 and 2 commits pushed
- **Commands**:
  ```bash
  # Si no tienes proyecto Railway todavía:
  railway init    # crea Y linkea el proyecto

  # Si ya lo creaste desde el dashboard:
  railway link    # solo linkea (no usar junto con init)

  # Deploy
  railway up
  ```
- **Acceptance Criteria**:
  - `railway up` exits 0
  - `GET /` returns HTTP 200 at Railway URL
  - Railway dashboard shows service status "Active"
- **Validation**:
  - Abrir URL de Railway en el browser, verificar que la landing carga

---

### Sprint 3 Commit (migraciones)

```bash
git add prisma/migrations/
git commit -m "chore: add initial prisma migration"
```

---

## Testing Strategy

| Sprint | Verificación |
|---|---|
| Sprint 1 | `git log --oneline` muestra commit limpio; `ls vercel.json` falla |
| Sprint 2 | `npx prisma validate` pasa; seed corre sin errores dos veces |
| Sprint 3 | `GET /` HTTP 200; Railway dashboard "Active"; datos en DB |

---

## Potential Risks & Gotchas

1. **`prisma/schema.prisma` ya existe incompleto** — Si el archivo existe pero le faltan `url` y `directUrl`, sobreescribirlo completo. No editarlo parcialmente.

2. **`DIRECT_URL` faltante en `.env` local** — `prisma migrate dev` fallará con error de conexión si solo tienes `DATABASE_URL`. Ambas variables son requeridas por el schema.

3. **`prisma generate` no corre automáticamente al crear el schema** — Después de crear `prisma/schema.prisma`, correr `npx prisma generate` manualmente si `lib/prisma.ts` o el seed dan errores de tipos antes del primer `npm install`.

4. **`railway init` vs `railway link`** — No correr ambos. `init` ya linkea. Usar `link` solo si el proyecto ya existe en el dashboard.

5. **`migrate dev` en BD con datos** — Solo para primer deploy con BD vacía. Para deploys futuros con schema changes usar `migrate deploy`.

6. **Orden del seed** — `MatchStepOption` debe borrarse antes que `MatchStep` por la FK con `onDelete: Cascade`. El seed ya lo hace en el orden correcto.

---

## Rollback Plan

- **Sprint 1**: `git revert` del commit restaura `vercel.json` y elimina `railway.toml`
- **Sprint 2**: `git revert` elimina el schema y seed. El Prisma client existente en `node_modules` no se ve afectado hasta el próximo `npm install`
- **Sprint 3**: Borrar el proyecto en Railway dashboard. La DB de Railway se elimina con el proyecto.
