# Sprint 2 — Importación CSV + Campaña de Outreach

**Fecha:** 2026-03-24
**Proyecto:** SpeakerMatch
**Alcance:** Subir un CSV de contactos en el admin, asignar tokens únicos, y disparar la campaña de outreach vía Zapier → Gmail con el link de invitación personalizado.

---

## Contexto

El campo `enviado_at` (DateTime?) ya existe en el modelo `Contact`. El campo `token` (VarChar(8) unique) también existe. `lib/site.ts` ya genera la URL de invitación con `inviteStartUrl(token)`. El webhook `ZAPIER_WEBHOOK_OUTREACH` está definido en `.env` pero nunca se dispara.

**Variables de entorno necesarias:**
- `ZAPIER_WEBHOOK_OUTREACH` — URL del catch hook de Zapier (ya en `.env`)
- `NEXT_PUBLIC_APP_URL` — Dominio público (ej: `https://tudominio.com`). **Si no está configurado, `inviteStartUrl` genera URLs con `http://localhost:3000` y los links del correo estarán rotos en producción.** Debe estar configurado antes de disparar la campaña.

---

## Flujo Completo

```
Admin sube CSV en /admin/importar
  → POST /api/admin/csv-import
      → parsea filas
      → por cada fila: si email ya existe → skip; si no → crea Contact con token único
      → retorna { imported: N, skipped: M, errors: [...] }

Admin revisa lista en /admin/clientes (estado: sin_ingresar)
  → hace clic "Disparar campaña" en /admin/importar

  → POST /api/admin/outreach
      → busca contactos con token IS NOT NULL AND enviado_at IS NULL
      → por cada uno: POST a ZAPIER_WEBHOOK_OUTREACH (fire-and-forget)
      → UPDATE enviado_at = now() para TODOS los ids (incluso si el fetch individual falló)
      → retorna { sent: N }

Page refresca el contador con router.refresh() tras el dispatch
```

---

## Formato del CSV

Header obligatorio en primera fila. Columnas:

| Columna | Requerida | Descripción |
|---|---|---|
| `nombre` | Sí | Primer nombre |
| `apellido` | Sí | Apellido |
| `empresa` | Sí | Nombre de la empresa |
| `email` | Sí | Email corporativo — clave de deduplicación |
| `fecha_evento` | No | Fecha estimada del evento (cualquier string) |

Separador: coma (`,`). Encoding: UTF-8. Columnas extra se ignoran.

---

## Contrato de Parsing CSV (`parseCsvText`)

Sin librería externa — implementación manual con estas reglas:

- Soporta line endings `\r\n` y `\n`
- La primera fila es el header; determina el índice de cada columna por nombre
- Columnas con commas dentro del valor **no están soportadas** (campos con comas romperán silenciosamente). Documentado como limitación conocida.
- La última fila vacía (trailing newline) se descarta silenciosamente
- Filas con menos columnas que el header se marcan como error y se saltan
- Retorna `{ rows: CsvRow[], parseErrors: string[] }`

---

## Deduplicación

Clave de deduplicación: **`email`** (case-insensitive).

Antes de crear cada contacto, se hace `findFirst({ where: { email: { equals: row.email, mode: "insensitive" } } })`. Si ya existe cualquier contacto con ese email (sin importar origen o token), la fila se cuenta en `skipped` y no se crea nada nuevo.

> Nota: `email` no tiene `@unique` en el schema de Prisma, por lo que la deduplicación se hace en código (no a nivel de BD). Esto es suficiente para el demo.

---

## Token de Invitación

Se genera con `randomBytes(4).toString("hex")` → 8 caracteres hex.
Si hay colisión (token ya existe), se reintenta hasta 3 veces. Si falla las 3, esa fila se agrega a `errors[]` y se salta.

---

## Campo `origen` para contactos importados

Los contactos creados vía CSV usan `origen: "outreach"` (default del schema). Esto es intencional: en la admin UI se mostrarán con badge "Invitación" (porque tienen token, no porque `origen` sea outreach — la lógica de `buildContactFlowDisplay` usa el token como señal, no el campo origen).

---

## Payload Zapier por Contacto

```json
{
  "nombre": "Ana",
  "apellido": "García",
  "empresa": "TechCo S.A.",
  "email": "ana@techco.mx",
  "fecha_evento": "2026-06-15",
  "invite_url": "https://tudominio.com/start?t=abc12345"
}
```

`invite_url` se construye con `inviteStartUrl(token)` de `lib/site.ts`.

---

## Comportamiento de Fallos en Outreach

El dispatch de webhooks es **fire-and-forget**: cada `fetch` se ejecuta sin `await`, y **`markContactsAsSent` se llama con TODOS los IDs pendientes independientemente de si el fetch individual tuvo éxito o falló**. Esto significa que un contacto con fallo de webhook queda marcado como enviado y no se reintenta automáticamente. Aceptable para MVP de demo.

---

## Arquitectura de Archivos

### 1. `lib/admin/outreach.ts` — NUEVO

```typescript
export interface CsvRow {
  nombre: string; apellido: string; empresa: string;
  email: string; fecha_evento?: string;
}

export interface ImportResult {
  imported: number; skipped: number;
  errors: Array<{ row: number; reason: string }>;
}

export function parseCsvText(text: string): { rows: CsvRow[]; parseErrors: string[] }
export async function generateUniqueToken(maxAttempts?: number): Promise<string>
export async function importContactsFromCsv(rows: CsvRow[]): Promise<ImportResult>
export async function getPendingOutreachContacts(): Promise<Array<{
  id: number; nombre: string; apellido: string;
  empresa: string; email: string; fecha_evento: string | null; token: string;
}>>
export async function getPendingOutreachCount(): Promise<number>
export async function markContactsAsSent(ids: number[]): Promise<void>
```

`getPendingOutreachContacts` filtra: `token IS NOT NULL AND enviado_at IS NULL`.
Esto incluye todos los contactos con token no enviados (tanto importados por CSV como cualquier otro con token). Este comportamiento es intencional — si en el futuro solo se quiere filtrar por origen se puede agregar `AND origen = "outreach"`.

### 2. `app/api/admin/csv-import/route.ts` — NUEVO

```
POST /api/admin/csv-import
Auth: getAdminSessionFromCookies() → 401 si no hay sesión
Body: multipart/form-data, campo "file" (.csv, max ~500 filas)
Response: { ok: true, data: { imported, skipped, errors[] } }
Errores: 400 sin archivo | 400 CSV sin header | 422 cero filas válidas
```

### 3. `app/api/admin/outreach/route.ts` — NUEVO

```
POST /api/admin/outreach
Auth: getAdminSessionFromCookies() → 401 si no hay sesión
Body: vacío
Response: { ok: true, data: { sent: N } }
Error: 503 si ZAPIER_WEBHOOK_OUTREACH no está configurado
```

### 4. `app/(admin)/admin/importar/page.tsx` — NUEVO (Client Component)

- **Sección A — Importar CSV:**
  - `<input type="file" accept=".csv">` + botón "Importar"
  - Submit via `fetch` → muestra resultado inline (importados / omitidos / errores por fila)
  - Link de descarga de plantilla CSV (texto generado en cliente)

- **Sección B — Disparar campaña:**
  - Contador de pendientes: cargado inicialmente server-side, refrescado con `router.refresh()` tras cada dispatch
  - Botón "Disparar campaña → N pendientes"
  - Deshabilitado si `pendientes === 0`
  - Tras dispatch exitoso: muestra "✅ Campaña enviada a N contactos" y refresca el contador vía `router.refresh()`

### 5. `components/admin/AdminNav.tsx` — MODIFICAR

Agregar ítem "Importar" (o "Campaña") con link a `/admin/importar` en el menú lateral.

---

## Seguridad

- Ambos API routes validan sesión admin
- CSV procesado en memoria, no guardado en disco
- Sin librería externa de parsing (superficie de ataque reducida)
- Máximo 500 filas por import (protección para demo)

---

## Criterios de Éxito

1. CSV de 4 filas nuevas → 4 contactos creados con tokens únicos y `origen="outreach"`, estado `sin_ingresar`
2. Mismo CSV de nuevo → `{ skipped: 4, imported: 0 }`
3. Botón "Disparar campaña" → Zapier recibe N payloads con `invite_url` válido; BD graba `enviado_at` en todos
4. Segunda disparo → `{ sent: 0 }` (ya tienen `enviado_at`)
5. `NEXT_PUBLIC_APP_URL` no configurado → `invite_url` muestra advertencia o fallback visible
6. `tsc --noEmit` pasa sin errores nuevos
