# Spec: Arquitectura MySQL + Prisma Unificada — Speaker Match

**Fecha:** 2026-03-13
**Proyecto:** Speaker Match (Speakers México)
**Estado:** Aprobado
**Reemplaza parcialmente:** `2026-03-12-personalized-landing-zapier-design.md` (sección Google Sheets)

---

## Contexto y Motivación

El spec anterior definía Google Sheets como fuente de verdad para los contactos/leads. Este spec reemplaza esa decisión: **toda la persistencia de datos se mueve a MySQL** (cloud: Railway, PlanetScale o similar compatible con Vercel).

Este spec cubre dos responsabilidades:
1. **Arquitectura de datos unificada** — Prisma schema con tablas para contactos/leads y preguntas del match
2. **MatchForm dinámico** — las preguntas y opciones del MatchForm se leen de MySQL en lugar de estar hardcodeadas en `lib/formData.ts`

El backoffice (`/admin`) que administrará estos datos es un spec separado.

---

## Arquitectura General

```
MySQL cloud (Railway / PlanetScale)
        ↕ Prisma ORM
Next.js (mismo repo)
  ├── Server Components → leen datos directo via Prisma
  ├── API Routes → /api/contact, /api/event (escriben a MySQL + llaman Zapier)
  └── Backoffice → /admin (spec separado)
        ↕
      Zapier → integración nativa MySQL + webhooks según flujo
        ↕
    Calendly
```

---

## 1. Prisma Schema

### Archivo: `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
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

## 2. Capa de Datos — `lib/`

### `lib/prisma.ts` — Singleton de Prisma Client

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

### `lib/matchSteps.ts` — Función de datos con fallback dummy

Esta función es el único punto de cambio entre datos dummy y BD real.

```typescript
import { prisma } from "./prisma";
import { matchSteps as dummySteps } from "./formData"; // datos actuales hardcodeados

export type MatchStepWithOptions = {
  id: number;
  question: string;
  columns: 1 | 2;  // BD no tiene constraint; getMatchSteps() valida que sea 1 o 2, defaulteando a 1 si el valor es otro
  options: string[];
};

export async function getMatchSteps(): Promise<MatchStepWithOptions[]> {
  try {
    const steps = await prisma.matchStep.findMany({
      where: { active: true },
      orderBy: { orden: "asc" },
      include: {
        options: {
          where: { active: true },
          orderBy: { orden: "asc" },
        },
      },
    });

    if (steps.length === 0) {
      // BD vacía: usar datos dummy (estado inicial antes de seed)
      return dummySteps.map((s) => ({
        id: s.id,
        question: s.question,
        columns: (s.columns ?? 1) as 1 | 2,
        options: s.options,
      }));
    }

    return steps.map((s) => ({
      id: s.id,
      question: s.question,
      columns: (s.columns === 2 ? 2 : 1) as 1 | 2,  // valida en runtime; default 1 si valor inesperado
      options: s.options.map((o) => o.label),
    }));
  } catch {
    // Error de conexión: degradación silenciosa a dummy data
    return dummySteps.map((s) => ({
      id: s.id,
      question: s.question,
      columns: (s.columns ?? 1) as 1 | 2,
      options: s.options,
    }));
  }
}
```

### `lib/contacts.ts` — Operaciones sobre la tabla Contact

```typescript
import { prisma } from "./prisma";

export async function findContactByToken(token: string) {
  return prisma.contact.findUnique({ where: { token } });
}

export async function findContactByEmail(email: string) {
  return prisma.contact.findFirst({ where: { email } });
}

export async function upsertContactEvent(
  identifier: { token?: string; email: string },
  data: Partial<{
    nombre: string;
    apellido: string;
    empresa: string;
    fecha_evento: string;
    match_answers: string[];
    form_started_at: Date;
    form_completed_at: Date;
    calendly_booked_at: Date;
    correo_abandono_enviado: boolean;
    origen: string;
  }>
) {
  const existing = identifier.token
    ? await findContactByToken(identifier.token)
    : await findContactByEmail(identifier.email);

  if (existing) {
    return prisma.contact.update({ where: { id: existing.id }, data });
  }

  // Contacto orgánico nuevo
  return prisma.contact.create({
    data: {
      email: identifier.email,
      nombre: data.nombre ?? "",
      apellido: data.apellido ?? "",
      empresa: data.empresa ?? "",
      origen: "organico",
      ...data,
    },
  });
}
```

---

## 3. Cambios en el Frontend

### `app/match/page.tsx` — Server Component

```tsx
import { Suspense } from "react";
import { getMatchSteps } from "@/lib/matchSteps";
import MatchForm from "@/components/match/MatchForm";
import GuaranteePanel from "@/components/match/GuaranteePanel";
import Logo from "@/components/ui/Logo";

export default async function MatchPage() {
  const steps = await getMatchSteps();

  return (
    <main className="min-h-screen bg-white">
      <div className="flex min-h-screen">
        <div className="flex-1 px-[var(--space-inline)] pt-header pb-section flex flex-col">
          <div className="mb-8 animate-fade-slide-in">
            <Logo size="sm" />
          </div>
          {/* ... título ... */}
          <div className="animate-fade-slide-in" style={{ animationDelay: "160ms" }}>
            <MatchForm steps={steps} />
          </div>
        </div>
        <aside className="hidden md:flex md:flex-col w-80 lg:w-96 shrink-0 h-screen">
          <div className="sticky top-0 flex-1 flex flex-col min-h-0">
            <GuaranteePanel />
          </div>
        </aside>
      </div>
    </main>
  );
}
```

> `MatchPage` pasa a ser `async` — válido en App Router Server Components.
> Se elimina el `<Suspense>` wrapper que envolvía a `MatchForm` — los datos llegan como props desde el Server Component asíncrono, por lo que no existe suspensión del lado del cliente en esta ubicación.

### `MatchForm.tsx` — Cambios necesarios

`MatchForm` recibe `steps` como prop en lugar de importarlos. Todos los usos internos de `matchSteps` se reemplazan por el prop `steps`:

```typescript
// Antes:
import { matchSteps } from "@/lib/formData";
// ...
const [answers, setAnswers] = useState<string[]>(Array(matchSteps.length).fill(""));
// ...
.map((_, i) => data.matchAnswers[i] ?? "")  // usa matchSteps.length implícitamente
// ...
if (currentStep < matchSteps.length - 1) { ... }
// ...
currentStep === matchSteps.length - 1 ? "Ver mi match" : "Siguiente →"

// Después:
interface Props {
  steps: MatchStepWithOptions[];
}
export default function MatchForm({ steps }: Props) {
  const [answers, setAnswers] = useState<string[]>(Array(steps.length).fill(""));
  // ...
  .map((_, i) => data.matchAnswers[i] ?? "")  // steps.length
  // ...
  if (currentStep < steps.length - 1) { ... }
  // ...
  currentStep === steps.length - 1 ? "Ver mi match" : "Siguiente →"
}
```

**Cambios requeridos en `MatchForm.tsx`:** reemplazar todas las referencias a `matchSteps` (4 ocurrencias: inicialización del estado, hidratación desde localStorage, condición de navegación, label del botón final) por el prop `steps`.

---

## 4. API Routes — Cambios respecto al spec anterior

Las rutas `/api/contact` y `/api/event` descritas en el spec anterior se mantienen, pero su implementación interna cambia:

| Ruta | Antes (spec anterior) | Ahora |
|---|---|---|
| `GET /api/contact?t={token}` | Lee Google Sheets API | Lee MySQL via `findContactByToken()` |
| `POST /api/event` | Llama webhook Zapier solamente | Escribe en MySQL via `upsertContactEvent()` + llama webhook Zapier |

La lógica del mismo-origin check y el comportamiento fire-and-forget del spec anterior se mantienen sin cambios.

### `match_answers` — flujo de escritura

El campo `Contact.match_answers` se escribe en el evento `form_completed`. El body del `POST /api/event` para `form_completed` se extiende con las respuestas del MatchForm:

```json
{
  "type": "form_completed",
  "token": "a3f2b1c9",
  "data": {
    "nombre": "Carlos",
    "apellido": "López",
    "empresa": "BBVA",
    "email": "carlos@bbva.com",
    "fecha": "2026-06-15",
    "matchAnswers": ["Inspirar y motivar al equipo", "Directivos", "..."]
  }
}
```

El componente `/gracias` lee `speakerMatchStore.matchAnswers` junto con los datos del intake al montar y los incluye en el evento `form_completed`. La ruta `/api/event` los pasa a `upsertContactEvent()` como `match_answers`.

---

## 5. Zapier — Cambio de integración (Google Sheets → MySQL)

El spec anterior describía 5 flujos Zapier usando Google Sheets. Todos se mantienen en lógica, solo cambia el conector:

| Flujo | Trigger | Acción MySQL | Notas |
|---|---|---|---|
| Flujo 1 — Envío de link | **Webhook Zapier** disparado manualmente o por script al crear contactos outreach | INSERT contact + UPDATE `token` + UPDATE `enviado_at` | Zapier no puede hacer trigger nativo confiable en MySQL; el proceso de carga de contactos llama al webhook de Zapier explícitamente |
| Flujo 2 — form_started | Webhook desde `/api/event` | Zapier hace UPDATE `form_started_at` via MySQL action | App también escribe a MySQL via Prisma |
| Flujo 3 — form_completed | Webhook desde `/api/event` | Zapier hace UPDATE `form_completed_at`, `fecha_evento`, `match_answers` via MySQL action | App también escribe a MySQL via Prisma |
| Flujo 4 — Calendly booked | Webhook de Calendly | Zapier hace UPDATE `calendly_booked_at` via MySQL action | Calendly → Zapier → MySQL |
| Flujo 5 — Abandono (scheduled) | Schedule Zapier (2x/día) | SELECT + correo + UPDATE `correo_abandono_enviado = 1` | `WHERE form_started_at IS NOT NULL AND form_completed_at IS NULL AND form_started_at < NOW() - INTERVAL 2 HOUR AND correo_abandono_enviado = 0` |

**`enviado_at`:** Zapier escribe este campo en Flujo 1 al generar el token y enviar el email, via MySQL action UPDATE.

**Flujo 1 — Proceso de carga de contactos outreach:**
Los contactos de outreach se crean con una herramienta de importación (CSV, script, o el futuro backoffice `/admin/contacts`). Al crear cada fila, el proceso llama al webhook del Flujo 1 de Zapier con los datos del contacto. Zapier genera el token, actualiza la fila en MySQL y envía el email. El backoffice tendrá esta funcionalidad integrada en su spec propio.

> **Doble escritura (Flujos 2 y 3):** La app escribe a MySQL via Prisma para consistencia inmediata. Zapier hace su propia escritura via MySQL action para el panel de leads en tiempo real. Si Zapier falla, MySQL ya tiene los datos desde la app — no hay pérdida de datos.

---

## 6. Seed de la Base de Datos

Un script de seed (`prisma/seed.ts`) carga los datos de `lib/formData.ts` a MySQL como estado inicial:

```typescript
// prisma/seed.ts
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

Comando: `npx prisma db seed`

---

## 7. Variables de Entorno

| Variable | Scope | Descripción | Reemplaza |
|---|---|---|---|
| `DATABASE_URL` | Server | Connection string MySQL (`mysql://user:pass@host/db`) | `GOOGLE_SERVICE_ACCOUNT_JSON` + `GOOGLE_SHEET_ID` |
| `ZAPIER_WEBHOOK_FORM_STARTED` | Server | Webhook Zapier para form_started | Sin cambio |
| `ZAPIER_WEBHOOK_FORM_COMPLETED` | Server | Webhook Zapier para form_completed | Sin cambio |
| `NEXT_PUBLIC_CALENDLY_URL` | Public | URL base del evento Calendly | Sin cambio |

---

## 8. Criterios de Aceptación

**Prisma + Schema:**
- `prisma/schema.prisma` tiene las tres tablas (`Contact`, `MatchStep`, `MatchStepOption`)
- `npx prisma migrate dev` crea las tablas sin errores
- `npx prisma db seed` carga los 5 pasos del match con todas sus opciones

**MatchForm dinámico:**
- Con BD vacía: el MatchForm muestra las preguntas dummy (fallback funciona)
- Con BD seedeada: el MatchForm muestra las preguntas de MySQL
- Si la conexión a MySQL falla: el MatchForm muestra las preguntas dummy sin error visible
- `MatchForm.tsx` no importa `matchSteps` directamente — solo recibe props

**API Routes:**
- `GET /api/contact?t={token}` devuelve datos de MySQL (no de Sheets)
- `POST /api/event` escribe en MySQL Y llama webhook Zapier

**Compatibilidad:**
- El spec anterior (`2026-03-12-personalized-landing-zapier-design.md`) sigue siendo válido en lógica y flujos — solo cambia la implementación interna de las API routes

---

## 9. Fuera de Alcance (specs separados)

- Backoffice `/admin` — CRUD de preguntas y gestión de contactos (spec propio)
- Autenticación del backoffice
- Migraciones de datos de Google Sheets a MySQL (no aplica — Google Sheets nunca se implementó)
- Elección definitiva del proveedor MySQL cloud (Railway vs PlanetScale vs otro)
