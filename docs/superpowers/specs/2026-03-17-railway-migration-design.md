# Spec: Migración a Railway — Speaker Match

**Fecha:** 2026-03-17
**Proyecto:** Speaker Match (Speakers México)
**Estado:** Aprobado
**Complementa:** `2026-03-17-postgresql-portable-design.md`

---

## Contexto y Motivación

El equipo decidió usar Railway como plataforma de deploy única. El código vive en local (sin repo remoto aún). Este spec cubre:

1. Configuración de Railway (`railway.toml`)
2. Eliminación de `vercel.json` (ya no aplica)
3. Creación de `prisma/schema.prisma` y `prisma/seed.ts` (aprobados en spec PostgreSQL, pendientes de implementar)
4. Variables de entorno en Railway dashboard
5. Guía de primer deploy via Railway CLI

---

## Sección 1: Archivos de Deploy

### `railway.toml` (nuevo)

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
healthcheckPath = "/"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
```

Railway detecta Next.js automáticamente via Nixpacks y corre `npm install` (que dispara `postinstall: prisma generate`) y `npm run build`. El `startCommand` lanza `next start`. El healthcheck en `/` le indica a Railway cuándo el proceso está listo para recibir tráfico.

### `vercel.json` (eliminar)

Contiene `buildCommand`, `devCommand`, `installCommand` — todo lo maneja Railway via Nixpacks sin config extra. Se elimina para evitar confusión.

---

## Sección 2: Prisma

Estos archivos están definidos en `2026-03-17-postgresql-portable-design.md`. Solo falta crearlos en el repo.

### `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ─── Contactos / Leads ───────────────────────────────────────────────────────

model Contact {
  id                      Int       @id @default(autoincrement())
  token                   String?   @unique @db.VarChar(8)
  nombre                  String    @db.VarChar(100)
  apellido                String    @db.VarChar(100)
  empresa                 String    @db.VarChar(200)
  email                   String    @db.VarChar(254)
  origen                  String    @default("outreach") @db.VarChar(20)
  enviado_at              DateTime?
  form_started_at         DateTime?
  form_completed_at       DateTime?
  fecha_evento            String?   @db.VarChar(20)
  calendly_booked_at      DateTime?
  correo_abandono_enviado Boolean   @default(false)
  match_answers           Json?
  created_at              DateTime  @default(now())

  @@index([email])
  @@index([origen, form_started_at])
}

// ─── Preguntas del Match ──────────────────────────────────────────────────────

model MatchStep {
  id       Int               @id @default(autoincrement())
  orden    Int
  question String            @db.VarChar(500)
  columns  Int               @default(1)
  active   Boolean           @default(true)
  options  MatchStepOption[]

  @@index([active, orden])
}

model MatchStepOption {
  id     Int       @id @default(autoincrement())
  stepId Int
  step   MatchStep @relation(fields: [stepId], references: [id], onDelete: Cascade)
  label  String    @db.VarChar(300)
  orden  Int
  active Boolean   @default(true)

  @@index([stepId, active, orden])
}
```

### `prisma/seed.ts`

Carga las preguntas del MatchForm desde `lib/formData.ts`. Idempotente — borra y recrea, seguro correrlo múltiples veces.

```typescript
import { PrismaClient } from "@prisma/client";
import { matchSteps } from "../lib/formData";

const prisma = new PrismaClient();

async function main() {
  await prisma.matchStepOption.deleteMany({});
  await prisma.matchStep.deleteMany({});

  for (const [i, step] of matchSteps.entries()) {
    const created = await prisma.matchStep.create({
      data: {
        orden: i + 1,
        question: step.question,
        columns: step.columns ?? 1,
        active: true,
      },
    });
    for (const [j, label] of step.options.entries()) {
      await prisma.matchStepOption.create({
        data: { stepId: created.id, label, orden: j + 1, active: true },
      });
    }
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
```

---

## Sección 3: Variables de Entorno en Railway

Railway Postgres plugin inyecta `DATABASE_URL` automáticamente al servicio Next.js. `DIRECT_URL` debe setearse manualmente con el mismo valor.

| Variable | Fuente | Valor |
|---|---|---|
| `DATABASE_URL` | Auto-inyectada por Railway Postgres | — |
| `DIRECT_URL` | Manual en Railway dashboard | Mismo valor que `DATABASE_URL` |
| `ZAPIER_WEBHOOK_OUTREACH` | Manual | URL del Zap 1 |
| `ZAPIER_WEBHOOK_FORM_STARTED` | Manual | URL del Zap 2 |
| `ZAPIER_WEBHOOK_FORM_COMPLETED` | Manual | URL del Zap 3 |
| `NEXT_PUBLIC_CALENDLY_URL` | Manual | URL del evento Calendly |

> **Atención:** `DIRECT_URL` es la variable más fácil de olvidar. Railway no la inyecta aunque uses su Postgres. Si falta, `prisma migrate` falla con un error de conexión.

---

## Sección 4: Guía de Primer Deploy

### Prerequisitos

```bash
# Instalar Railway CLI (una sola vez)
npm install -g @railway/cli

# Login
railway login
```

### Paso 1 — Crear proyecto en Railway

```bash
# Desde la carpeta del proyecto
railway init
railway link
```

### Paso 2 — Agregar Postgres

En el dashboard de Railway:
- Proyecto → **Add Service** → **Database** → **PostgreSQL**
- Railway inyecta `DATABASE_URL` automáticamente al servicio Next.js

### Paso 3 — Configurar variables de entorno

En el dashboard → servicio Next.js → **Variables**:
1. Copiar el valor de `DATABASE_URL` (ya inyectado)
2. Crear `DIRECT_URL` con ese mismo valor
3. Agregar `ZAPIER_WEBHOOK_OUTREACH`, `ZAPIER_WEBHOOK_FORM_STARTED`, `ZAPIER_WEBHOOK_FORM_COMPLETED`, `NEXT_PUBLIC_CALENDLY_URL`

### Paso 4 — Primera migración (desde local)

```bash
# Copiar DATABASE_URL de Railway a .env local
# Luego:
npx prisma migrate dev --name init   # crea las tablas
npx prisma db seed                    # carga preguntas del MatchForm
```

### Paso 5 — Deploy

```bash
railway up
```

### Deploys futuros

```bash
railway up
```

Si hay migraciones nuevas, correrlas desde local antes del deploy:

```bash
npx prisma migrate deploy
railway up
```

---

## Archivos Modificados / Creados

| Archivo | Acción |
|---|---|
| `railway.toml` | Crear |
| `vercel.json` | Eliminar |
| `prisma/schema.prisma` | Crear |
| `prisma/seed.ts` | Crear |

Sin cambios en código de app (`lib/`, `app/`, `components/`).

---

## Criterios de Aceptación

- `railway.toml` existe en la raíz del proyecto
- `vercel.json` eliminado del repo
- `prisma/schema.prisma` tiene `provider = "postgresql"` y `directUrl = env("DIRECT_URL")`
- `npx prisma migrate dev --name init` crea las tres tablas sin errores apuntando a Railway Postgres
- `npx prisma db seed` carga los pasos del MatchForm sin errores
- `npx prisma db seed` corrido dos veces no produce duplicados
- `railway up` termina exitosamente y la app responde en la URL de Railway

---

## Fuera de Alcance

- Configuración de dominio custom en Railway
- CI/CD con GitHub Actions o similar
- Backoffice `/admin`
- API routes `/api/contact` y `/api/event` (spec separado)
