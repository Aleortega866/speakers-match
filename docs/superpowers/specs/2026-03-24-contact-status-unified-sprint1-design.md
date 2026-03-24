# Sprint 1 — Estados de Contacto Unificados

**Fecha:** 2026-03-24
**Proyecto:** SpeakerMatch
**Alcance:** Sistema de 4 estados unificados para todos los contactos, visibles en admin `/clientes` y dashboard `/admin`

---

## Contexto

El sistema actual en `contactFlow.ts` tiene lógica bifurcada: estados distintos para contactos invitados (con token) vs orgánicos (sin token). Esto produce inconsistencia visual y dificulta leer el embudo.

Los campos de BD ya existen y son suficientes — **ninguna migración requerida**:
- `form_started_at` — se graba al terminar el intake form
- `form_completed_at` — se graba al llegar a `/gracias`
- `calendly_booked_at` — actualmente nunca se graba (Sprint 3 lo resuelve)
- `token` — presente solo en contactos pre-importados por invitación

---

## Los 4 Estados

| Estado | `ContactStatus` | Condición en BD | Prisma `where` |
|---|---|---|---|
| Sin ingresar | `"sin_ingresar"` | `form_started_at IS NULL` | `{ form_started_at: null }` |
| En proceso | `"en_proceso"` | `form_started_at NOT NULL AND form_completed_at IS NULL` | `{ form_started_at: { not: null }, form_completed_at: null }` |
| Completo sin cita | `"completo_sin_cita"` | `form_completed_at NOT NULL AND calendly_booked_at IS NULL` | `{ form_completed_at: { not: null }, calendly_booked_at: null }` |
| Agendado | `"agendado"` | `calendly_booked_at NOT NULL` | `{ calendly_booked_at: { not: null } }` |

**Prioridad de evaluación (en memoria):** `agendado` → `completo_sin_cita` → `en_proceso` → `sin_ingresar`

**Nota sobre orgánicos:** Los contactos orgánicos no existen en BD hasta que completan el intake (disparan `form_started`). Por tanto nunca caen en `sin_ingresar` — ese estado es exclusivo de contactos pre-importados por CSV (Sprint 2).

---

## Badges Visuales

| `ContactStatus` | Label mostrado | Clases Tailwind |
|---|---|---|
| `sin_ingresar` | "Sin ingresar" | `border border-slate-200 bg-slate-100 text-slate-700` |
| `en_proceso` | "En proceso" | `border border-sky-200 bg-sky-50 text-sky-900` |
| `completo_sin_cita` | "Completo · sin cita" | `border border-amber-200 bg-amber-50 text-amber-900` |
| `agendado` | "Agendado" | `border border-emerald-200 bg-emerald-50 text-emerald-800` |

Los labels anteriores ("Sin ingresar al enlace", "En formulario", "Cuestionario listo · sin cita", "Completado", "Pendiente", "Incompleto", "Agendado (Calendly)") quedan **retirados**.

---

## Cambios por Archivo

### 1. `lib/admin/contactFlow.ts` — Reescritura completa

**Tipo exportado:**
```typescript
export type ContactStatus =
  | "sin_ingresar"
  | "en_proceso"
  | "completo_sin_cita"
  | "agendado";
```

**Input interface** (se elimina `answersCount` — ya no influye en el estado):
```typescript
export interface ContactFlowFields {
  form_started_at: Date | null;
  form_completed_at: Date | null;
  calendly_booked_at: Date | null;
  // token y origen se mantienen solo para originChannel
  token: string | null;
  origen: string;
}
```

**Función principal de estado:**
```typescript
export function getContactStatus(fields: ContactFlowFields): ContactStatus {
  if (fields.calendly_booked_at) return "agendado";
  if (fields.form_completed_at)  return "completo_sin_cita";
  if (fields.form_started_at)    return "en_proceso";
  return "sin_ingresar";
}
```

**Display output** — `ContactFlowDisplay` se simplifica (se eliminan `flowLabel` y `flowBadgeClass` a favor de derivarlos del status):
```typescript
export interface ContactFlowDisplay {
  status: ContactStatus;
  statusLabel: string;       // "Sin ingresar" | "En proceso" | "Completo · sin cita" | "Agendado"
  statusBadgeClass: string;  // clases Tailwind según tabla de badges
  originChannel: OriginChannel;
  originChannelLabel: string; // "Invitación" | "Orgánico" — SE MANTIENE
  originDb: string;
}
```

`buildContactFlowDisplay` delega en `getContactStatus` y una función `statusToDisplay(status)` que retorna `{ statusLabel, statusBadgeClass }`.

### 2. `lib/admin/types.ts`

`AdminClientListItem` se actualiza:
```typescript
export interface AdminClientListItem {
  id: number;
  fullName: string;
  email: string;
  company: string;
  completedAt: Date | null;
  answersCount: number;          // SE MANTIENE como dato informativo en tabla
  originChannelLabel: string;    // SE MANTIENE
  status: ContactStatus;         // NUEVO — reemplaza flowLabel + flowBadgeClass
  statusLabel: string;           // NUEVO
  statusBadgeClass: string;      // NUEVO
  // flowLabel y flowBadgeClass se ELIMINAN
}
```

`ContactStatus` se re-exporta desde este archivo para conveniencia:
```typescript
export type { ContactStatus } from "@/lib/admin/contactFlow";
```

### 3. `lib/admin/clients.ts`

**KPIs — firma nueva:**
```typescript
export async function getAdminClientsKpis(search?: string): Promise<{
  sinIngresar: number;
  enProceso: number;
  completoSinCita: number;
  agendado: number;
}>
```
Los 4 counts usan las condiciones Prisma de la tabla de estados combinadas con el filtro de búsqueda si existe.

**Filtro por estado en `listAdminClients`:**
```typescript
export async function listAdminClients(input: {
  search?: string;
  page?: string;
  pageSize?: string;
  status?: ContactStatus;   // NUEVO — parámetro opcional
}): Promise<AdminClientListResult>
```

Cuando `status` está presente, se agrega a la cláusula `where` de Prisma usando el mapeo de la tabla de estados. Si se combina con `search`, se usa `{ AND: [searchWhere, statusWhere] }`.

**URL param:** El filtro se recibe como `?status=en_proceso` en el `searchParams` de la page. Valores inválidos se ignoran (sin estado activo = "Todos").

### 4. `lib/admin/dashboard.ts`

El bloque `attention` (3 campos) se **reemplaza** por `statusCounts` (4 campos):

```typescript
export interface AdminDashboardSnapshot {
  totals: {
    contacts: number;
    questionnairesCompleted: number;   // SE MANTIENE para compatibilidad
    contactsWithInviteToken: number;   // SE MANTIENE para compatibilidad
    speakers: number;
    speakersActive: number;
    clientMatches: number;
    activeMatchSteps: number;
  };
  statusCounts: {                      // REEMPLAZA 'attention'
    sinIngresar: number;
    enProceso: number;
    completoSinCita: number;
    agendado: number;
  };
  recentContacts: Array<{
    // mismo shape que AdminClientListItem (status, statusLabel, statusBadgeClass)
  }>;
}
```

Los 3 campos anteriores de `attention` (`inviteNotOpened`, `formInProgress`, `completedWithoutCalendly`) quedan **eliminados**. Sus counts son equivalentes a los nuevos (con diferencia en `sin_ingresar` que ahora no filtra por token — es más amplio y correcto).

### 5. `app/(admin)/admin/clientes/page.tsx`

**Filtro por estado** — tabs de un solo click sobre la tabla:
```
[Todos] [Sin ingresar N] [En proceso N] [Completo sin cita N] [Agendado N]
```
- Implementado como `<a href="/admin/clientes?status=en_proceso">` (GET nativo, sin JS)
- El tab activo recibe clase visual diferenciada (`bg-black text-white` vs borde)
- Los conteos `N` vienen de `getAdminClientsKpis` (siempre sin filtro de status, con filtro de search si aplica)
- Compatible con el buscador: `?search=Ana&status=en_proceso` funciona

### 6. `app/(admin)/admin/page.tsx`

Las 3 tarjetas de "atención" se reemplazan por 4 tarjetas de estado:

```
┌──────────────────┬──────────────────┬────────────────────┬──────────────┐
│  Sin ingresar    │   En proceso     │ Completo sin cita  │   Agendado   │
│       12         │        4         │         8          │      3       │
└──────────────────┴──────────────────┴────────────────────┴──────────────┘
```

Cada tarjeta enlaza a `/admin/clientes?status=<valor>` para drill-down directo.

---

## Actualización del Seed (`prisma/seed.ts`)

Los 4 contactos actuales tienen `form_started_at` y `form_completed_at` pero no `calendly_booked_at` ni `token` — todos muestran `completo_sin_cita`. Para cubrir los 4 estados en desarrollo, el seed se actualiza:

| Contacto | Cambio en seed | Estado resultante |
|---|---|---|
| Juan Pérez | Agregar `token: "abc12345"`, quitar timestamps | `sin_ingresar` |
| María López | Quitar `form_completed_at` y `match_answers` | `en_proceso` |
| Carlos Ruiz | Sin cambio | `completo_sin_cita` |
| Ana García | Agregar `calendly_booked_at: new Date()` | `agendado` |

---

## Flujo de Datos Completo

```
BD (Contact)
  └─ form_started_at, form_completed_at, calendly_booked_at, token, origen
       └─ getContactStatus(fields)          [contactFlow.ts]
            └─ buildContactFlowDisplay()
                 ├─ toListItem()            [clients.ts → AdminClientListItem]
                 │    └─ /admin/clientes    (badge por fila + tabs de filtro)
                 └─ dashboard mapping       [dashboard.ts → statusCounts]
                      └─ /admin            (4 tarjetas de estado)
```

---

## Lo que NO cambia en este Sprint

- Esquema de BD (ninguna migración)
- Flujo del formulario público (`/start`, `/match`, `/gracias`)
- Webhooks Zapier existentes
- Lógica de `calendly_booked_at` (Sprint 3)
- Importación CSV (Sprint 2)
- Columna "Respuestas" (`answersCount`) en la tabla de clientes — se mantiene como dato informativo

---

## Criterios de Éxito

1. Cada contacto en `/admin/clientes` muestra exactamente uno de los 4 badges con el color correcto
2. Los tabs de filtro por estado retornan solo los contactos del estado seleccionado; combinable con búsqueda por texto
3. El dashboard `/admin` muestra los 4 conteos correctos en tarjetas enlazadas al listado filtrado
4. Los 4 contactos del seed cubren los 4 estados (uno por estado) tras la actualización del seed
5. `tsc --noEmit` pasa sin errores nuevos
6. Las páginas que consumían `flowLabel`/`flowBadgeClass` no rompen (usan `statusLabel`/`statusBadgeClass`)
