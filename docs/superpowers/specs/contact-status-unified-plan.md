# Plan: Contact Status Unified (Sprint 1)

**Generated**: 2026-03-24
**Estimated Complexity**: Medium
**Spec**: `docs/superpowers/specs/2026-03-24-contact-status-unified-sprint1-design.md`

---

## Overview

Reemplazar la lógica bifurcada de estados de contacto (invited vs orgánico) por un sistema unificado de 4 estados basado en los campos `form_started_at`, `form_completed_at`, y `calendly_booked_at` ya existentes en la BD. Sin migraciones. Los cambios van de las capas internas hacia afuera: tipos → lógica → queries → UI.

**Orden de dependencias:**
```
Task 1 (contactFlow.ts)
  → Task 2 (types.ts)
       → Task 3 (clients.ts)
            → Task 4 (dashboard.ts)
                 → Task 5 (admin/page.tsx)
                 → Task 6 (clientes/page.tsx)
  → Task 7 (seed.ts)  ← independiente
```

---

## Prerequisites

- Node.js + pnpm/npm corriendo localmente
- `.env.local` con `DATABASE_URL` válido (Neon)
- Servidor Next.js detenido durante cambios en lib/ (o con hot-reload)
- No requiere nuevas dependencias ni migraciones de BD

---

## Sprint 1: Capa de Tipos y Lógica

**Goal**: Reescribir `contactFlow.ts` y actualizar `types.ts` — la base de la que depende todo lo demás.

**Demo/Validation**:
- `npx tsc --noEmit` pasa sin errores en estos dos archivos
- Los imports de `flowLabel`/`flowBadgeClass` en consumers muestran error TS (esperado, se resuelven en sprint 2)

### Task 1.1: Reescribir `lib/admin/contactFlow.ts`

- **Location**: `lib/admin/contactFlow.ts`
- **Description**: Reemplazar el archivo completo con la nueva implementación:
  1. Exportar `ContactStatus` type union: `"sin_ingresar" | "en_proceso" | "completo_sin_cita" | "agendado"`
  2. Actualizar `ContactFlowFields` — eliminar `answersCount`, mantener `token`, `origen`, los 3 timestamps
  3. Implementar `getContactStatus(fields): ContactStatus` con prioridad: `agendado → completo_sin_cita → en_proceso → sin_ingresar`
  4. Implementar `statusToDisplay(status): { statusLabel: string; statusBadgeClass: string }` con los 4 pares label/clase Tailwind del spec
  5. Actualizar `ContactFlowDisplay` — reemplazar `flowLabel`/`flowBadgeClass` por `status`, `statusLabel`, `statusBadgeClass`; mantener `originChannel`, `originChannelLabel`, `originDb`
  6. Actualizar `buildContactFlowDisplay` para delegar en `getContactStatus` y `statusToDisplay`
  7. Eliminar funciones `organicFlow` e `invitationFlow` (ya no se usan)
- **Dependencies**: Ninguna
- **Acceptance Criteria**:
  - `getContactStatus({ calendly_booked_at: new Date(), ... })` → `"agendado"`
  - `getContactStatus({ form_completed_at: new Date(), calendly_booked_at: null, ... })` → `"completo_sin_cita"`
  - `getContactStatus({ form_started_at: new Date(), form_completed_at: null, ... })` → `"en_proceso"`
  - `getContactStatus({ form_started_at: null, form_completed_at: null, calendly_booked_at: null, ... })` → `"sin_ingresar"`
  - `ContactFlowDisplay` no tiene `flowLabel` ni `flowBadgeClass`
- **Validation**: `npx tsc --noEmit` muestra errores solo en consumers (clients.ts, dashboard.ts, pages) — no en contactFlow.ts

---

### Task 1.2: Actualizar `lib/admin/types.ts`

- **Location**: `lib/admin/types.ts`
- **Description**:
  1. Re-exportar `ContactStatus` desde contactFlow: `export type { ContactStatus } from "@/lib/admin/contactFlow";`
  2. En `AdminClientListItem`: eliminar `flowLabel: string` y `flowBadgeClass: string`; agregar `status: ContactStatus`, `statusLabel: string`, `statusBadgeClass: string`
  3. El resto de interfaces (`AdminClientDetail`, `AdminClientMatch`, `AdminClientListResult`, `AdminSpeakerListItem`, `AdminSpeakerListResult`) no cambian
- **Dependencies**: Task 1.1 (ContactStatus debe existir)
- **Acceptance Criteria**:
  - `AdminClientListItem` tiene exactamente los 3 campos nuevos y no tiene los 2 eliminados
  - `ContactStatus` es importable desde `@/lib/admin/types`
- **Validation**: `npx tsc --noEmit` — errores solo en clients.ts, dashboard.ts, pages (consumers)

---

## Sprint 2: Capa de Queries (clients.ts y dashboard.ts)

**Goal**: Actualizar las funciones de acceso a datos para usar el nuevo sistema de estados.

**Demo/Validation**:
- `npx tsc --noEmit` pasa en lib/admin/clients.ts y lib/admin/dashboard.ts
- Queries de conteo retornan los 4 números correctos probados con datos del seed

### Task 2.1: Actualizar `lib/admin/clients.ts`

- **Location**: `lib/admin/clients.ts`
- **Description**:
  1. Actualizar la función `toListItem` — reemplazar el uso de `flow.flowLabel` y `flow.flowBadgeClass` por `flow.status`, `flow.statusLabel`, `flow.statusBadgeClass`
  2. Eliminar `answersCount` del input a `buildContactFlowDisplay` (ya no es parte de `ContactFlowFields`)
  3. Actualizar `getAdminClientsKpis` — nueva firma que retorna `{ sinIngresar, enProceso, completoSinCita, agendado }`. Usar `prisma.$transaction` con 4 counts usando los Prisma `where` del spec:
     - `sinIngresar`: `{ form_started_at: null }` + search filter si existe
     - `enProceso`: `{ form_started_at: { not: null }, form_completed_at: null }` + search
     - `completoSinCita`: `{ form_completed_at: { not: null }, calendly_booked_at: null }` + search
     - `agendado`: `{ calendly_booked_at: { not: null } }` + search
  4. Agregar parámetro `status?: ContactStatus` a `listAdminClients`. Implementar `buildStatusWhere(status)` que retorna el `where` Prisma correspondiente o `undefined` si no hay status. Combinar con search usando `{ AND: [searchWhere, statusWhere] }` cuando ambos existen
  5. Validar que `status` recibido sea un valor válido del type (rechazar silenciosamente valores no reconocidos)
- **Dependencies**: Tasks 1.1, 1.2
- **Acceptance Criteria**:
  - `toListItem` no referencia `flowLabel` ni `flowBadgeClass`
  - `getAdminClientsKpis` retorna objeto con 4 campos numéricos
  - `listAdminClients({ status: "en_proceso" })` filtra correctamente
  - Combinación `listAdminClients({ search: "Ana", status: "agendado" })` funciona
- **Validation**: `npx tsc --noEmit` sin errores en este archivo

---

### Task 2.2: Actualizar `lib/admin/dashboard.ts`

- **Location**: `lib/admin/dashboard.ts`
- **Description**:
  1. Actualizar `AdminDashboardSnapshot` — reemplazar bloque `attention: { inviteNotOpened, formInProgress, completedWithoutCalendly }` por `statusCounts: { sinIngresar, enProceso, completoSinCita, agendado }`
  2. En `getAdminDashboardSnapshot`: reemplazar las 3 queries de attention por 4 queries de statusCounts dentro del `$transaction` existente (mantener el mismo número de queries en la transacción, ajustando las que se eliminan vs agregan)
  3. Actualizar el mapping de `recentContacts` — reemplazar `flow.flowLabel`/`flow.flowBadgeClass` por `flow.status`/`flow.statusLabel`/`flow.statusBadgeClass`
  4. Actualizar la forma del array `recentContacts` en `AdminDashboardSnapshot` para incluir `status`, `statusLabel`, `statusBadgeClass` en lugar de `flowLabel`, `flowBadgeClass`
- **Dependencies**: Tasks 1.1, 1.2
- **Acceptance Criteria**:
  - `AdminDashboardSnapshot` no tiene campo `attention`
  - `snapshot.statusCounts.sinIngresar` es un número
  - `recentContacts[0].statusLabel` es un string (no undefined)
- **Validation**: `npx tsc --noEmit` sin errores en este archivo

---

## Sprint 3: Capa UI (páginas admin)

**Goal**: Actualizar las dos páginas del admin para usar el nuevo sistema de estados y agregar el filtro por estado.

**Demo/Validation**:
- `npm run dev` sin errores de compilación
- `/admin/clientes` muestra los 4 badges por colores correctos
- Tabs de filtro funcionan y se combinan con búsqueda
- `/admin` muestra 4 tarjetas de estado con conteos y links

### Task 3.1: Actualizar `app/(admin)/admin/clientes/page.tsx`

- **Location**: `app/(admin)/admin/clientes/page.tsx`
- **Description**:
  1. Agregar `status?: string` al destructuring de `searchParams` (junto con `search`, `page`, `pageSize`)
  2. Pasar `status` como parámetro a `listAdminClients` (el tipo `ContactStatus` se valida internamente en clients.ts)
  3. Reemplazar las 2 `StatCard` actuales (`kpis.completed`, `kpis.withInvite`) por 4 `StatCard` de estados usando los campos de `getAdminClientsKpis`
  4. Agregar bloque de tabs de filtro entre el header y la tabla. Cada tab es un `<a>` con href que preserva `search` si existe:
     - "Todos" → `/admin/clientes?search=xxx` (sin status)
     - "Sin ingresar (N)" → `?search=xxx&status=sin_ingresar`
     - "En proceso (N)" → `?search=xxx&status=en_proceso`
     - "Completo sin cita (N)" → `?search=xxx&status=completo_sin_cita`
     - "Agendado (N)" → `?search=xxx&status=agendado`
     - Tab activo: `bg-black text-white rounded-full px-3 py-1 text-xs font-bold`
     - Tab inactivo: `border border-black/20 rounded-full px-3 py-1 text-xs font-semibold text-black/70 hover:bg-black/5`
  5. En la tabla, reemplazar `item.flowBadgeClass` y `item.flowLabel` por `item.statusBadgeClass` y `item.statusLabel`
- **Dependencies**: Tasks 2.1, 2.2
- **Acceptance Criteria**:
  - Tabs visibles sobre la tabla, tab activo resaltado
  - Filtrar por "En proceso" muestra solo contactos con ese estado
  - Combinar filtro + búsqueda funciona
  - Badges en tabla usan los colores del spec
- **Validation**: Navegación manual en `/admin/clientes` con distintos tabs y búsquedas

---

### Task 3.2: Actualizar `app/(admin)/admin/page.tsx`

- **Location**: `app/(admin)/admin/page.tsx`
- **Description**:
  1. Actualizar el destructuring: `const { totals, recentContacts, statusCounts } = snapshot` (reemplazar `attention`)
  2. Reemplazar el bloque `<article>` de "Por atender" (3 `<li>` con `attention.*`) por 4 tarjetas en grid `2x2` con `statusCounts.*`:
     ```
     ┌─────────────────┬─────────────────┐
     │  Sin ingresar   │   En proceso    │
     │       N →link   │       N →link   │
     ├─────────────────┼─────────────────┤
     │ Completo s/cita │    Agendado     │
     │       N →link   │       N →link   │
     └─────────────────┴─────────────────┘
     ```
     Cada tarjeta es un `<Link href="/admin/clientes?status=<valor>">` que envuelve el número y label
  3. En la tabla de `recentContacts`, reemplazar `c.flowBadgeClass`/`c.flowLabel` por `c.statusBadgeClass`/`c.statusLabel`
- **Dependencies**: Task 2.2
- **Acceptance Criteria**:
  - Dashboard muestra 4 tarjetas de estado con sus conteos
  - Cada tarjeta es clickeable y lleva al listado filtrado correcto
  - Tabla de últimos contactos muestra badges con colores correctos
  - No aparece ninguna referencia a `attention` ni `flowLabel`/`flowBadgeClass`
- **Validation**: Navegación en `/admin`, verificar links de tarjetas, verificar badges de tabla

---

## Sprint 4: Seed Data

**Goal**: Actualizar el seed para que los 4 contactos de demo cubran los 4 estados, permitiendo verificar visualmente cada badge.

**Demo/Validation**:
- `npx prisma db seed` ejecuta sin errores
- `/admin/clientes` muestra exactamente un contacto de cada color de badge

### Task 4.1: Actualizar `prisma/seed.ts`

- **Location**: `prisma/seed.ts`
- **Description**: Modificar los 4 contactos seeded para que cada uno resulte en un estado distinto:

  | Contacto | Cambio | Estado esperado |
  |---|---|---|
  | Juan Pérez | Agregar `token: "abc12345"`, no poner `form_started_at` ni `form_completed_at` | `sin_ingresar` |
  | María López | Solo poner `form_started_at: new Date()`, no `form_completed_at` ni `match_answers` | `en_proceso` |
  | Carlos Ruiz | Sin cambio (mantener ambos timestamps) | `completo_sin_cita` |
  | Ana García | Mantener ambos timestamps, agregar `calendly_booked_at: new Date()` | `agendado` |

  **Nota técnica:** Juan Pérez ahora tiene token, lo que requiere que el upsert use `token` como campo único cuando existe. El seed ya usa `findFirst({ where: { email } })` para el lookup — mantener ese patrón pero en el `data` del update/create incluir `token` para Juan.

  **Importante:** Los `ClientMatch` para Juan (ahora sin `form_completed_at`) siguen creándose — el seed los genera para todos los contactos independientemente del estado del formulario. Esto está bien para demo.
- **Dependencies**: Ninguna (independiente de las demás tasks)
- **Acceptance Criteria**:
  - Seed ejecuta sin errores
  - BD tiene 4 contactos con estados distintos: uno por cada `ContactStatus`
  - Juan Pérez tiene `token = "abc12345"` y timestamps null
  - Ana García tiene `calendly_booked_at` no nulo
- **Validation**:
  ```bash
  npx prisma db seed
  # verificar en /admin/clientes: 4 badges de 4 colores distintos
  ```

---

## Testing Strategy

### Verificación por tarea
- Cada task en lib/: `npx tsc --noEmit` debe pasar (o mostrar solo errores en dependientes aún no actualizados)
- Tasks de UI: inspección visual en dev server

### Verificación final completa
1. `npx tsc --noEmit` — sin errores TypeScript
2. `npx prisma db seed` — 4 contactos con estados distintos
3. `/admin/clientes` — 4 badges de colores distintos en la tabla
4. `/admin/clientes?status=sin_ingresar` — solo Juan Pérez
5. `/admin/clientes?status=en_proceso` — solo María López
6. `/admin/clientes?status=completo_sin_cita` — solo Carlos Ruiz
7. `/admin/clientes?status=agendado` — solo Ana García
8. `/admin/clientes?search=juan&status=sin_ingresar` — resultado correcto combinado
9. `/admin` — 4 tarjetas de estado con conteos `1, 1, 1, 1`
10. Click en tarjeta de dashboard → navega a listado filtrado correcto

---

## Potential Risks & Gotchas

### 1. Token único en seed para Juan Pérez
El campo `token` es `@unique` en el schema. Si el seed corre múltiples veces, el upsert de Juan fallará si otro contacto ya tiene `token: "abc12345"`. El seed usa `findFirst({ where: { email } })` — si Juan ya existe, el update sobrescribe su token sin problema. Pero si se cambió su email entre runs, podría haber colisión. **Mitigación:** el seed ya es idempotente por email; agregar el token solo en el `data` no en el `where`.

### 2. `getAdminClientsKpis` siempre sin filtro de status
Los conteos de los tabs deben mostrar el total por estado independientemente del filtro de status activo (solo filtran por search). Asegurarse de que `getAdminClientsKpis` NO recibe el `status` param — solo `search`. Esto evita que el tab "En proceso (N)" muestre 0 cuando estás filtrado por "Agendado".

### 3. Combinación AND de search + status en Prisma
Cuando ambos filtros están activos, la query usa `{ AND: [searchWhere, statusWhere] }`. Verificar que Prisma no anida incorrectamente cuando solo uno de los dos está presente (el otro debe ser `undefined`, no `{}`).

### 4. Páginas de detalle `/admin/clientes/[id]`
La página de detalle (`app/(admin)/admin/clientes/[id]/page.tsx`) consume `AdminClientDetail` que no cambia en este sprint. Sin embargo, si en el futuro se agrega un badge de estado ahí, ya está disponible a través de `getContactStatus`. No requiere cambios ahora.

### 5. Orden de tasks es estricto
`contactFlow.ts` → `types.ts` → `clients.ts`/`dashboard.ts` → pages. Si se modifica una page antes de actualizar su lib, el compilador TS mostrará errores de tipos que pueden confundirse con bugs reales.

---

## Rollback Plan

Todos los cambios son en archivos TypeScript sin migraciones de BD. Para revertir:
```bash
git diff --name-only  # verificar archivos cambiados
git checkout -- lib/admin/contactFlow.ts lib/admin/types.ts lib/admin/clients.ts lib/admin/dashboard.ts app/(admin)/admin/clientes/page.tsx app/(admin)/admin/page.tsx prisma/seed.ts
```
La BD no necesita rollback — ninguna columna fue alterada.
