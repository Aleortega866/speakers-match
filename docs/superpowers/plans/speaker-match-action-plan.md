# Plan: Speaker Match — Plan de Acción Completo

**Generated**: 2026-03-17
**Estimated Complexity**: High
**Basado en specs**: master-spec-estimaciones, postgresql-portable-design, landing-campaign-design

---

## Overview

El proyecto Speaker Match tiene el flujo base funcional (`/` → `/match` → `/gracias`) pero sin base de datos, sin API routes, sin la landing informativa de campaña, y sin personalización por token. Este plan convierte ese prototipo en producto completo en 5 sprints ejecutables.

**Arquitectura final:**
```
/                    ← Landing informativa (Server Component, personalizable por token)
/start               ← IntakeForm (movido desde /)
/start?t={token}     ← IntakeForm con precarga desde Neon
/match               ← MatchForm (refactorizado, steps desde DB)
/gracias             ← Calendly CTA + envío de evento form_completed
/api/contact         ← GET: busca contacto por token
/api/event           ← POST: registra eventos + dispara webhooks Zapier
```

---

## Prerequisites

- [ ] Cuenta en Neon (neon.tech) con proyecto creado y `DATABASE_URL` + `DIRECT_URL` disponibles
- [ ] Cuenta Zapier (para Fase 4)
- [ ] Cuenta Calendly con evento de 15 min creado (para Fase 4)
- [ ] Variables de entorno listas en `.env.local` (local) y Vercel (producción)

---

## Sprint 0: Infraestructura Base — Base de Datos y Lib Layer

**Goal**: PostgreSQL conectado, schema migrado, seed cargado, funciones de acceso a datos listas.
**Bloquea**: todos los sprints siguientes.
**Skill**: ninguno — trabajo de infraestructura puro.

**Demo/Validation**:
- `npx prisma db execute --stdin <<< "SELECT 1;"` termina sin error
- `npx prisma migrate dev --name init` crea las 3 tablas
- `npx prisma db seed` carga 5 pasos del match sin error
- `npx prisma db seed` corrido 2 veces no produce duplicados
- `getMatchSteps()` retorna datos con BD vacía (fallback) y con BD seedeada

---

### Task 0.1: Instalar dependencias
- **Descripción**: Instalar Prisma, cliente y ts-node
- **Comando**: `npm install prisma @prisma/client && npm install -D ts-node`
- **Acceptance Criteria**:
  - `node_modules/@prisma/client` existe
  - `node_modules/ts-node` existe

### Task 0.2: Crear `.env.example`
- **Location**: `.env.example`
- **Descripción**: Crear archivo de referencia con todas las variables del proyecto. Documentar diferencia entre `DATABASE_URL` (pooled) y `DIRECT_URL` (directa) para Neon/Supabase vs Railway/Render.
- **Contenido**:
```bash
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
DIRECT_URL="postgresql://user:pass@host:5432/dbname"
ZAPIER_WEBHOOK_OUTREACH=""
ZAPIER_WEBHOOK_FORM_STARTED=""
ZAPIER_WEBHOOK_FORM_COMPLETED=""
NEXT_PUBLIC_CALENDLY_URL=""
```
- **Acceptance Criteria**:
  - `.env.example` en la raíz del proyecto
  - `.env.local` existe (no commiteado) con valores reales de Neon

### Task 0.3: Crear `prisma/schema.prisma`
- **Location**: `prisma/schema.prisma`
- **Descripción**: Schema PostgreSQL portable con modelos `Contact`, `MatchStep`, `MatchStepOption`. Patrón dual URL para portabilidad entre proveedores.
- **Spec exacto**: Ver `2026-03-17-postgresql-portable-design.md` — sección "Archivos a Crear"
- **Acceptance Criteria**:
  - `provider = "postgresql"`
  - `directUrl = env("DIRECT_URL")` presente
  - 3 modelos con todos los campos del spec
  - Índices en `Contact.email`, `Contact.[origen, form_started_at]`
  - `MatchStepOption` tiene `onDelete: Cascade` hacia `MatchStep`

### Task 0.4: Actualizar `package.json` con scripts de Prisma
- **Location**: `package.json`
- **Descripción**: Agregar `postinstall` y configuración del seed
- **Cambios**:
```json
"scripts": {
  "postinstall": "prisma generate",
  ...
},
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```
- **Acceptance Criteria**:
  - `npm install` genera el cliente Prisma automáticamente

### Task 0.5: Ejecutar migración inicial
- **Descripción**: Crear tablas en Neon
- **Comando**: `npx prisma migrate dev --name init`
- **Acceptance Criteria**:
  - Carpeta `prisma/migrations/` creada
  - Las 3 tablas existen en Neon (verificar en Neon console)

### Task 0.6: Crear `prisma/seed.ts`
- **Location**: `prisma/seed.ts`
- **Descripción**: Seed idempotente que lee `matchSteps` de `lib/formData.ts` y los carga en PostgreSQL. Elimina registros previos antes de insertar.
- **Spec exacto**: Ver `2026-03-17-postgresql-portable-design.md` — sección seed
- **Dependencias**: Task 0.5
- **Acceptance Criteria**:
  - `npx prisma db seed` carga 5 pasos con todas sus opciones
  - Corrido 2 veces: mismo resultado, sin duplicados ni errores

### Task 0.7: Crear `lib/prisma.ts`
- **Location**: `lib/prisma.ts`
- **Descripción**: Singleton de PrismaClient. Evita conexiones duplicadas en hot reload.
- **Spec exacto**: Ver `2026-03-17-postgresql-portable-design.md` — sección lib/prisma.ts
- **Acceptance Criteria**:
  - Exporta `prisma` como singleton
  - No crea nuevas instancias en hot reload de dev

### Task 0.8: Crear `lib/contacts.ts`
- **Location**: `lib/contacts.ts`
- **Descripción**: Funciones de acceso a datos para `Contact`:
  - `findContactByToken(token: string): Promise<Contact | null>`
  - `upsertContactEvent(payload): Promise<void>` — maneja `form_started`, `form_completed`
- **Spec de referencia**: `2026-03-13-mysql-prisma-unified-architecture-design.md` sección 2 (lógica idéntica, solo cambia proveedor)
- **Dependencias**: Task 0.7
- **Acceptance Criteria**:
  - `findContactByToken("token-inexistente")` retorna `null` sin lanzar
  - `upsertContactEvent` con tipo `form_started` actualiza `form_started_at`
  - `upsertContactEvent` con tipo `form_completed` guarda `match_answers` como JSON

### Task 0.9: Crear `lib/matchSteps.ts`
- **Location**: `lib/matchSteps.ts`
- **Descripción**: `getMatchSteps()` — lee pasos desde PostgreSQL con fallback a `lib/formData.ts` si la BD está vacía o falla la conexión.
- **Spec de referencia**: `2026-03-13-mysql-prisma-unified-architecture-design.md` sección 2
- **Dependencias**: Task 0.7
- **Acceptance Criteria**:
  - Con BD seedeada: retorna los 5 pasos de PostgreSQL
  - Con BD vacía: retorna los datos de `formData.ts` (fallback)
  - Si la conexión falla (`DATABASE_URL` incorrecta): retorna fallback sin romper la app

---

## Sprint 1: API Routes + Middleware

**Goal**: Las rutas `/api/contact` y `/api/event` funcionan y están rate-limitadas.
**Depende de**: Sprint 0
**Skills**:
- 🔧 **`api-design-principles`** — invocar ANTES de escribir las routes para validar el diseño de la API
- 🔧 **`error-handling-patterns`** — invocar para asegurar manejo robusto de errores en las routes

**Demo/Validation**:
- `curl "http://localhost:3000/api/contact?t=TOKEN_VALIDO"` → 200 con datos del contacto
- `curl "http://localhost:3000/api/contact?t=INVALIDO"` → 404
- `curl -X POST http://localhost:3000/api/event -d '{"type":"form_started",...}'` → 200
- Más de 30 requests/min desde la misma IP a `/api/contact` → 429

---

### Task 1.1: Crear `app/api/contact/route.ts`
- **Location**: `app/api/contact/route.ts`
- **Descripción**: `GET /api/contact?t={token}` — llama `findContactByToken()`, retorna datos del contacto o 404
- **Dependencias**: Sprint 0 completo
- **Acceptance Criteria**:
  - Sin `?t` → 400 Bad Request
  - Token inválido → 404 Not Found
  - Token válido → 200 `{ nombre, apellido, empresa, email }`
  - Never expone campos sensibles no necesarios

### Task 1.2: Crear `app/api/event/route.ts`
- **Location**: `app/api/event/route.ts`
- **Descripción**: `POST /api/event` — same-origin check (header `Origin`), llama `upsertContactEvent()`, dispara webhook Zapier correspondiente (fire-and-forget, no bloquea respuesta). Para `form_completed`: parsea `data.matchAnswers` y lo pasa como `match_answers`.
- **Dependencias**: Sprint 0 completo
- **Acceptance Criteria**:
  - Request sin header `Origin` correcto → 403
  - Body malformado → 400
  - `form_started`: escribe `form_started_at`, dispara `ZAPIER_WEBHOOK_FORM_STARTED`
  - `form_completed`: escribe `form_completed_at` + `match_answers`, dispara `ZAPIER_WEBHOOK_FORM_COMPLETED`
  - Webhook Zapier se llama con `fetch()` sin `await` (fire-and-forget)

### Task 1.3: Crear `middleware.ts`
- **Location**: `middleware.ts` (raíz del proyecto)
- **Descripción**: Rate limiting 30 req/min por IP en `/api/contact`. Usar headers estándar `X-RateLimit-*`.
- **Dependencias**: ninguna (independiente)
- **Acceptance Criteria**:
  - Solo aplica a rutas `/api/contact`
  - Más de 30 req/min desde misma IP → 429 con `Retry-After` header
  - Otras rutas no afectadas

---

## Sprint 2: Speaker Match — Reorganización y Mejoras

**Goal**: IntakeForm en `/start`, precarga con token, MatchForm lee desde DB, `/gracias` con Calendly real.
**Depende de**: Sprint 1
**Puede correr en paralelo con**: Sprint 3 (secciones estáticas)
**Skills**:
- 🎨 **`vercel-react-best-practices`** — invocar al refactorizar `app/match/page.tsx` como async Server Component
- 🔍 **`react-doctor`** — invocar al finalizar este sprint para revisar `IntakeForm` y `MatchForm`

**Demo/Validation**:
- `/start` carga el IntakeForm (sin landing)
- `/start?t=TOKEN_VALIDO` precarga campos nombre, apellido, empresa, email
- `/match` carga preguntas desde PostgreSQL
- `/gracias` muestra botón que abre Calendly con prefill

---

### Task 2.1: Crear `app/start/page.tsx`
- **Location**: `app/start/page.tsx`
- **Descripción**: Server Component que renderiza `IntakeForm` envuelto en `<Suspense>` (requerido para `useSearchParams`)
- **Acceptance Criteria**:
  - `/start` funciona igual que la `/` actual (sin landing)
  - La ruta `/` sigue funcionando (no se rompe nada)

### Task 2.2: Extender `speakerMatchStore.ts` con campo `token`
- **Location**: `lib/speakerMatchStore.ts`
- **Descripción**: Agregar `token?: string` a `SpeakerMatchData`. Actualizar `getDefaultData()`, `readSpeakerMatchData()`, `writeSpeakerMatchData()` para incluir el campo.
- **Dependencias**: ninguna (independiente)
- **Acceptance Criteria**:
  - `writeSpeakerMatchData({ token: "abc123" })` persiste el token
  - `readSpeakerMatchData().token` retorna el valor guardado
  - Datos existentes en localStorage sin `token` no rompen la hidratación

### Task 2.3: Agregar precarga por token en `IntakeForm`
- **Location**: `components/intake/IntakeForm.tsx`
- **Descripción**:
  1. Agregar `useSearchParams()` para leer `?t=`
  2. Al montar (después de hidratación): si hay token, llamar `GET /api/contact?t={token}`
  3. Precargar `formData` con `{ nombre, apellido, empresa, email }` de la respuesta
  4. Persistir token en store via `writeSpeakerMatchData({ token })`
  5. Si falla o token inválido: form carga vacío, sin error visible al usuario
- **Dependencias**: Task 2.1, Task 2.2, Sprint 1
- **Acceptance Criteria**:
  - `/start?t=TOKEN_VALIDO`: campos precargados, editables
  - `/start?t=TOKEN_INVALIDO`: form vacío, sin mensaje de error
  - `/start` sin token: comportamiento actual sin cambios
  - El `started` inicial se puede setear en `true` automáticamente si hay datos precargados

### Task 2.4: Refactorizar `app/match/page.tsx` como async Server Component
- **Location**: `app/match/page.tsx`
- **Descripción**: Convertir a async Server Component. Llamar `getMatchSteps()` del servidor y pasar `steps` como prop a `MatchForm`.
- **Dependencias**: Sprint 0
- **Acceptance Criteria**:
  - `app/match/page.tsx` no tiene `"use client"`
  - Llama `getMatchSteps()` con `await`
  - Pasa `steps` como prop a `<MatchForm steps={steps} />`
  - Con BD caída: fallback funciona, page no rompe

### Task 2.5: Refactorizar `MatchForm.tsx` para recibir `steps` como prop
- **Location**: `components/match/MatchForm.tsx`
- **Descripción**: Agregar prop `steps: MatchStep[]` y eliminar el import de `matchSteps` de `lib/formData.ts`. Adaptar las referencias internas.
- **Dependencias**: Task 2.4
- **Acceptance Criteria**:
  - No importa `matchSteps` desde `formData.ts`
  - Recibe y usa `steps` prop
  - Comportamiento visual idéntico al actual

### Task 2.6: Actualizar `app/gracias/page.tsx` con Calendly real
- **Location**: `app/gracias/page.tsx`
- **Descripción**:
  1. Al montar: enviar `POST /api/event` con `{ type: "form_completed", matchAnswers: [...] }` leyendo datos del store
  2. Reemplazar botón actual con link a `NEXT_PUBLIC_CALENDLY_URL` con prefill de nombre+email
  3. Prefill URL format: `?name={nombre}%20{apellido}&email={email}`
- **Dependencias**: Task 1.2, Task 2.2
- **Acceptance Criteria**:
  - `form_completed` se registra en Neon al llegar a `/gracias`
  - El botón Calendly abre la URL correcta con nombre y email precargados
  - Si `NEXT_PUBLIC_CALENDLY_URL` no está configurada: botón deshabilitado o muestra placeholder

---

## Sprint 3: Landing Informativa

**Goal**: `app/page.tsx` es la landing de campaña con 10 secciones, responsive, con hero condicional por token.
**Depende de**: Sprint 0 (para hero personalizado) — secciones estáticas pueden comenzar antes
**Paralela con**: Sprint 2
**Skills** (invocar en este orden):
1. 🧠 **`brainstorming`** — invocar ANTES de implementar para explorar variantes visuales del hero y layout de secciones
2. 🎨 **`frontend-design`** — invocar para cada componente de landing (diseño de producción, no genérico)
3. ✨ **`frontend-ui-animator`** — invocar AL FINAL del sprint para agregar animaciones fade-slide-in consistentes
4. 🔍 **`react-doctor`** — invocar al terminar todo el sprint para revisión

**Demo/Validation**:
- `/` carga el landing (no el IntakeForm)
- `/?t=TOKEN_VALIDO` muestra hero personalizado con nombre y empresa
- `/?t=INVALIDO` muestra hero genérico (fallback silencioso)
- `/start` carga el IntakeForm correctamente
- Todas las secciones se renderizan en el orden correcto
- FAQ es interactivo (acordeón)
- Responsive en mobile (375px), tablet (768px), desktop (1280px)

---

### Task 3.1: Extraer `components/landing/ClientLogos.tsx`
- **Location**: `components/landing/ClientLogos.tsx`
- **Descripción**: Extraer el bloque de logos de `app/page.tsx` actual. Reutilizar el `Set` de `INVERTED_LOGOS` y los datos de `socialProofLogos` de `lib/formData.ts`.
- **Acceptance Criteria**:
  - Renderiza los 5 logos con el mismo estilo visual actual
  - `app/page.tsx` actualizado para importar este componente

### Task 3.2: Crear `components/landing/Hero.tsx`
- **Location**: `components/landing/Hero.tsx`
- **Descripción**: Hero condicional. Recibe `contact: Contact | null` y `token: string | null`. Si `contact` no es null → hero personalizado con nombre y empresa. Si es null → hero orgánico genérico. CTA apunta a `/start?t={token}` o `/start`.
- **Copy exacto**: Ver `2026-03-13-landing-campaign-design.md` sección "Hero"
- **Skill**: `frontend-design` para el layout visual
- **Acceptance Criteria**:
  - Con `contact`: título personalizado con nombre y empresa
  - Sin `contact`: título orgánico genérico
  - CTA apunta a la ruta correcta según presencia de token
  - Tagline "Sin costo · Sin compromiso · Propuesta en 24 hrs" siempre visible

### Task 3.3: Crear `components/landing/HowItWorks.tsx`
- **Location**: `components/landing/HowItWorks.tsx`
- **Descripción**: 3 pasos estáticos numerados. Completamente estático, sin lógica de cliente.
- **Copy exacto**: Ver spec landing sección "Cómo funciona"
- **Skill**: `frontend-design`

### Task 3.4: Crear `components/landing/SpeakerShowcase.tsx`
- **Location**: `components/landing/SpeakerShowcase.tsx`
- **Descripción**: Grid 2×2 con 3 speaker cards + 1 card contador "+200 speakers". Datos dummy hardcodeados.
- **Skill**: `frontend-design`
- **Acceptance Criteria**:
  - Grid 2×2 en desktop, 1×1 stack en mobile
  - Photos con `next/image` placeholder

### Task 3.5: Crear `components/landing/WhyUs.tsx`
- **Location**: `components/landing/WhyUs.tsx`
- **Descripción**: 4 métricas en grid 2×2. Datos estáticos.
- **Métricas**: +15 años, +500 eventos, +200 speakers, 98% retención
- **Skill**: `frontend-design`

### Task 3.6: Crear `components/landing/Testimonials.tsx`
- **Location**: `components/landing/Testimonials.tsx`
- **Descripción**: 2 testimonios con foto placeholder, nombre, cargo, empresa. Datos dummy.
- **Skill**: `frontend-design`

### Task 3.7: Crear `components/landing/Guarantee.tsx`
- **Location**: `components/landing/Guarantee.tsx`
- **Descripción**: Sección fondo negro (#111), texto blanco. Componente nuevo — NO reutiliza `GuaranteePanel` (está acoplado al layout sidebar de `/match`).
- **Copy exacto**: Ver spec landing sección "Garantía"
- **Skill**: `frontend-design`

### Task 3.8: Crear `components/landing/FAQ.tsx`
- **Location**: `components/landing/FAQ.tsx`
- **Descripción**: Client Component (`"use client"`). Acordeón colapsable con 4 preguntas. Estado de apertura por pregunta con `useState`. Cargado en `app/page.tsx` via `next/dynamic` para no bloquear el bundle.
- **Preguntas**: Ver spec landing sección "FAQ"
- **Skill**: `frontend-design` para el estilo del acordeón
- **Acceptance Criteria**:
  - Cada pregunta se expande/colapsa independientemente
  - En `app/page.tsx` se importa con `dynamic(() => import(...), { ssr: false })`

### Task 3.9: Crear `components/landing/FinalCTA.tsx`
- **Location**: `components/landing/FinalCTA.tsx`
- **Descripción**: CTA de remate con urgencia. Recibe `token: string | null` para el link correcto.
- **Copy**: Ver spec landing sección "CTA Final"
- **Skill**: `frontend-design`

### Task 3.10: Crear `components/landing/Footer.tsx`
- **Location**: `components/landing/Footer.tsx`
- **Descripción**: Footer simple. Copyright Speakers México + links Términos/Privacidad.

### Task 3.11: Reorganizar `app/page.tsx` como Server Component
- **Location**: `app/page.tsx`
- **Descripción**: Reemplazar el contenido actual por el landing informativo. Server Component que:
  1. Await `searchParams` (Next.js 16: es una Promise)
  2. Lee `t` del query param
  3. Si hay token: llama `findContactByToken(token).catch(() => null)`
  4. Renderiza todos los componentes landing en orden
  5. Carga `FAQ` con `next/dynamic`
- **Dependencias**: Tasks 3.1 a 3.10, Sprint 0
- **Acceptance Criteria**:
  - `app/page.tsx` no tiene `"use client"`
  - Implementa el patrón de `searchParams` como Promise (Next.js 16)
  - `/` ya no muestra IntakeForm

### Task 3.12: Animaciones con `frontend-ui-animator`
- **Descripción**: Pasar `frontend-ui-animator` sobre todos los componentes landing para agregar animaciones `fade-slide-in` consistentes con el resto del proyecto (usa los keyframes ya definidos en `globals.css`).
- **Skill**: 🎨 **`frontend-ui-animator`**
- **Dependencias**: Tasks 3.1–3.11
- **Acceptance Criteria**:
  - Animaciones respetan `prefers-reduced-motion`
  - Consistencia visual con las animaciones de `/match` y `/gracias`

---

## Sprint 4: Zapier + Calendly (No-code)

**Goal**: Los 5 Zaps configurados y probados. Flujo end-to-end funcional.
**Depende de**: Sprints 1 y 2
**Nota**: Este sprint es mayormente no-code. No aplican skills de código.

**Demo/Validation**:
- Zap 1: recibir contacto en Neon via webhook → recibir email con link `/?t={token}`
- Zap 2: iniciar form → `form_started_at` actualizado en Neon
- Zap 3: completar form → delay 30min → si no hay `calendly_booked_at` → email recordatorio
- Zap 4: agendar en Calendly → `calendly_booked_at` actualizado en Neon
- Zap 5: 2x/día → emails de abandono a quien empezó pero no completó

---

### Task 4.1: Verificar conectividad Neon ↔ Zapier
- Confirmar que Neon acepta conexiones externas de IPs de Zapier (por defecto sí, verificar SSL)

### Task 4.2: Zap 1 — Outreach
- Webhook (`ZAPIER_WEBHOOK_OUTREACH`) → genera token → INSERT en Neon → email con `/?t={token}`

### Task 4.3: Zap 2 — form_started
- Webhook (`ZAPIER_WEBHOOK_FORM_STARTED`) → UPDATE `form_started_at` en Neon (INSERT si orgánico)

### Task 4.4: Zap 3 — form_completed + recordatorio
- Webhook (`ZAPIER_WEBHOOK_FORM_COMPLETED`) → UPDATE Neon → delay 30min → re-lee → si no `calendly_booked_at` → email "agenda tu llamada"

### Task 4.5: Zap 4 — Calendly booked
- Evento Calendly → busca por email en Neon → UPDATE `calendly_booked_at`

### Task 4.6: Zap 5 — Abandono
- Schedule 2x/día → SELECT abandonos → email → UPDATE `correo_abandono_enviado = true`

### Task 4.7: Configurar Calendly
- Evento 15 min, webhook hacia Zapier (Zap 4), probar prefill URL

---

## Sprint 5: QA y Deploy

**Goal**: Flujo end-to-end verificado en producción.
**Depende de**: Todos los sprints anteriores
**Skills**:
- 🧪 **`frontend-testing-best-practices`** — invocar para definir los E2E tests críticos de los flujos invitado y orgánico
- 🔍 **`simplify`** — invocar sobre los archivos modificados en los sprints anteriores para revisión final de calidad

**Demo/Validation**:
- Flujo invitado completo funciona en producción
- Flujo orgánico completo funciona en producción
- Panel Neon muestra filas correctamente escritas

---

### Task 5.1: Prueba flujo invitado
- `/?t=token` → hero personalizado → `/start?t=token` → campos precargados → match → gracias → Calendly abre con prefill

### Task 5.2: Prueba flujo orgánico
- `/` → hero genérico → `/start` → form vacío → match → gracias → Calendly abre

### Task 5.3: Prueba Zapier end-to-end
- Ejecutar flujo completo con contacto real y verificar que los 5 Zaps disparan correctamente

### Task 5.4: Verificar panel Neon
- Confirmar que `Contact` tiene `form_started_at`, `form_completed_at`, `match_answers` correctos

### Task 5.5: Configurar variables en Vercel y deploy
- Verificar que todas las env vars están en Vercel: `DATABASE_URL`, `DIRECT_URL`, todos los `ZAPIER_WEBHOOK_*`, `NEXT_PUBLIC_CALENDLY_URL`
- Ejecutar `npx prisma migrate deploy` en el pipeline de Vercel (o manualmente antes del deploy)
- Smoke test en producción

---

## Resumen de Skills por Sprint

| Sprint | Task | Skill | Cuándo invocar |
|--------|------|-------|----------------|
| 0 | Infraestructura | — | No aplica |
| 1 | API Routes | **`api-design-principles`** | Antes de escribir las routes |
| 1 | Manejo de errores | **`error-handling-patterns`** | Al implementar error handling en routes |
| 2 | async Server Component | **`vercel-react-best-practices`** | Al refactorizar `app/match/page.tsx` |
| 2 | Revisión React | **`react-doctor`** | Al finalizar Sprint 2 |
| 3 | Diseño visual | **`brainstorming`** | ANTES de implementar (explorar variantes) |
| 3 | Todos los componentes | **`frontend-design`** | Al implementar cada componente landing |
| 3 | Animaciones | **`frontend-ui-animator`** | Al finalizar todos los componentes |
| 3 | Revisión React | **`react-doctor`** | Al finalizar Sprint 3 |
| 5 | Tests E2E | **`frontend-testing-best-practices`** | Para definir casos de prueba críticos |
| 5 | Calidad de código | **`simplify`** | Revisión final de archivos modificados |

---

## Dependencias Críticas

```
Sprint 0 (Neon + lib layer)
    ↓
Sprint 1 (API Routes)
    ↓              ↘
Sprint 2           Sprint 3 (secciones estáticas sin token son independientes)
(Speaker Match)    (hero personalizado requiere Sprint 0)
    ↓
Sprint 4 (Zapier)
    ↓
Sprint 5 (QA + Deploy)
```

---

## Testing Strategy

- **Sprint 0**: Comandos Prisma como validación (`migrate dev`, `db seed` x2)
- **Sprint 1**: curl / Postman manual contra el dev server
- **Sprint 2**: Prueba manual de cada ruta con y sin token
- **Sprint 3**: Visual en 375px, 768px, 1280px. Test de FAQ acordeón.
- **Sprint 4**: Zapier tiene test built-in por Zap. Verificar en Neon console.
- **Sprint 5**: E2E definidos con `frontend-testing-best-practices`

---

## Potential Risks & Gotchas

### 1. Next.js 16 — `searchParams` como Promise
**Riesgo**: En Next.js 16, `searchParams` en Server Components es una `Promise` y debe awaitearse. Si se usa como objeto directo (patrón de Next.js 14/15), TypeScript puede no advertirlo y falla en runtime.
**Mitigación**: El spec ya incluye el patrón correcto: `const { t } = await searchParams`.

### 2. `useSearchParams` requiere `<Suspense>`
**Riesgo**: `IntakeForm` usa `useSearchParams()`. Si `app/start/page.tsx` no envuelve el form en `<Suspense>`, Next.js lanza error en build.
**Mitigación**: Task 2.1 incluye el `<Suspense>` explícitamente.

### 3. Seed vs Schema en `lib/formData.ts`
**Riesgo**: `prisma/seed.ts` importa `matchSteps` de `lib/formData.ts`. Si el tipo exportado no coincide exactamente con lo que el seed espera, falla en runtime.
**Mitigación**: Task 0.6 verifica que `matchSteps` exporta `{ question, columns?, options: string[] }`.

### 4. Prisma Client en hot reload
**Riesgo**: Sin el singleton de `lib/prisma.ts`, Next.js hot reload crea múltiples instancias de PrismaClient, agotando las conexiones de Neon.
**Mitigación**: Task 0.7 implementa el singleton correcto.

### 5. Same-origin check en `/api/event`
**Riesgo**: El header `Origin` puede estar ausente en algunos entornos de test/CI.
**Mitigación**: En dev/test, el check debe ser configurable o relajado via env var.

### 6. Zapier + Neon SSL
**Riesgo**: Neon requiere SSL. El conector PostgreSQL de Zapier debe configurarse con SSL habilitado.
**Mitigación**: Task 4.1 verifica esto antes de configurar los Zaps.

### 7. `DIRECT_URL` en Vercel
**Riesgo**: Si solo se configura `DATABASE_URL` en Vercel pero no `DIRECT_URL`, `prisma migrate deploy` falla en el pipeline CI/CD.
**Mitigación**: Task 5.5 verifica ambas variables explícitamente.

---

## Rollback Plan

- **Sprint 0**: `npx prisma migrate reset` deshace todas las tablas en Neon
- **Sprint 1**: Eliminar archivos de route — sin estado, sin side effects
- **Sprint 2**: La ruta `/` puede restaurarse a su estado actual en un commit
- **Sprint 3**: Secciones estáticas sin dependencias — revertir commit individual
- **Deploy**: Vercel permite rollback a deployment previo en 1 click
