# Spec: PostgreSQL Portable — Speaker Match

**Fecha:** 2026-03-17
**Proyecto:** Speaker Match (Speakers México)
**Estado:** Aprobado
**Actualiza:** `2026-03-13-mysql-prisma-unified-architecture-design.md`

---

## Contexto y Motivación

El spec `2026-03-13-mysql-prisma-unified-architecture-design.md` definía MySQL como proveedor. El master spec (`2026-03-13-master-spec-estimaciones.md`) actualizó esa decisión a PostgreSQL. Este spec formaliza la implementación portable: el código funciona con cualquier proveedor PostgreSQL estándar (Railway, Neon, Supabase, Render, Docker local) cambiando únicamente variables de entorno.

---

## Decisión de Diseño

**Patrón Dual URL (`DATABASE_URL` + `DIRECT_URL`).**

Prisma soporta nativamente dos URLs en el datasource:
- `DATABASE_URL` — usada por la app en runtime (puede ser una URL pooled si el proveedor lo soporta)
- `DIRECT_URL` — usada solo por Prisma para migraciones (conexión directa, sin pooler)

Si el proveedor no necesita separación (Railway, Render, Docker), ambas variables reciben el mismo valor. Si el proveedor usa pooling separado (Neon, Supabase), cada variable recibe su URL correspondiente. El código de app nunca cambia.

### Portabilidad por proveedor

| Proveedor | DATABASE_URL | DIRECT_URL |
|---|---|---|
| Railway | misma URL | misma URL |
| Neon | URL pooled (`?pgbouncer=true`) | URL directa |
| Supabase | URL pooler (puerto 6543) | URL directa (puerto 5432) |
| Render | misma URL | misma URL |
| Docker local | misma URL | misma URL |

---

## Archivos a Crear

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

---

### `prisma/seed.ts`

Carga las preguntas del MatchForm desde `lib/formData.ts` como estado inicial.

```typescript
import { PrismaClient } from "@prisma/client";
import { matchSteps } from "../lib/formData";

const prisma = new PrismaClient();

async function main() {
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

### `lib/prisma.ts`

Singleton de Prisma Client. Evita conexiones duplicadas en desarrollo (hot reload). Funciona en serverless y servidores persistentes.

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

---

### `lib/contacts.ts`

Sin cambios respecto al spec anterior (`2026-03-13-mysql-prisma-unified-architecture-design.md`, sección 2). Todas las operaciones usan el singleton `prisma` y son agnósticas al proveedor.

---

### `lib/matchSteps.ts`

Sin cambios respecto al spec anterior. Incluye fallback a `lib/formData.ts` si la BD está vacía o si la conexión falla.

---

### `.env.example`

```bash
# PostgreSQL — cualquier proveedor compatible
#
# Si tu proveedor NO usa pooling separado (Railway, Render, Docker local):
#   pon el mismo valor en DATABASE_URL y DIRECT_URL
#
# Si tu proveedor SÍ usa pooling separado (Neon, Supabase):
#   DATABASE_URL = URL pooled
#   DIRECT_URL   = URL directa (para migraciones)

DATABASE_URL="postgresql://user:pass@host:5432/dbname"
DIRECT_URL="postgresql://user:pass@host:5432/dbname"

# Zapier webhooks
ZAPIER_WEBHOOK_FORM_STARTED=""
ZAPIER_WEBHOOK_FORM_COMPLETED=""
ZAPIER_WEBHOOK_OUTREACH=""

# Calendly
NEXT_PUBLIC_CALENDLY_URL=""
```

---

## Cambio en `package.json`

Agregar `postinstall` para que el cliente Prisma se genere automáticamente en cualquier deploy:

```json
"scripts": {
  "postinstall": "prisma generate",
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

---

## Flujo de Migraciones

Los tres comandos son idénticos en cualquier proveedor PostgreSQL:

```bash
# Primera vez — crea las tablas
npx prisma migrate dev --name init

# En cada deploy — aplica migraciones pendientes
npx prisma migrate deploy

# Una vez — carga preguntas del MatchForm
npx prisma db seed
```

`prisma migrate dev` usa `DIRECT_URL` para crear la migración.
`prisma migrate deploy` usa `DIRECT_URL` para aplicarla.
La app en runtime usa `DATABASE_URL`.

---

## Dependencias a Instalar

```bash
npm install prisma @prisma/client
npm install -D ts-node
```

Agregar a `package.json` para el seed:

```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

---

## Criterios de Aceptación

- `prisma/schema.prisma` tiene `provider = "postgresql"` y `directUrl = env("DIRECT_URL")`
- `npx prisma migrate dev --name init` crea las tres tablas sin errores en cualquier proveedor PostgreSQL
- `npx prisma db seed` carga los pasos del match sin errores
- Con BD vacía: `getMatchSteps()` retorna los datos dummy (fallback funciona)
- Con BD seedeada: `getMatchSteps()` retorna los datos de PostgreSQL
- Si la conexión falla: `getMatchSteps()` retorna los datos dummy sin error visible
- Cambiar de proveedor requiere únicamente actualizar `DATABASE_URL` y `DIRECT_URL`

---

## Fuera de Alcance

- Backoffice `/admin` (spec separado)
- Configuración específica de cada proveedor (se documenta en `.env.example`)
- Autenticación del backoffice
