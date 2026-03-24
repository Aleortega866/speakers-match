# Plan: CSV Import + Outreach Campaign (Sprint 2)

**Generated**: 2026-03-24
**Complexity**: Medium
**Spec**: `docs/superpowers/specs/2026-03-24-csv-import-outreach-sprint2-design.md`

## Overview

Implementar en orden de dependencias: librería de lógica → API routes → página admin.

```
Task 1: lib/admin/outreach.ts     (base — todo depende de aquí)
Task 2: POST /api/admin/csv-import
Task 3: POST /api/admin/outreach
Task 4: app/(admin)/admin/importar/page.tsx
Task 5: components/admin/AdminNav.tsx
```

---

## Task 1 — `lib/admin/outreach.ts`

**Archivo nuevo.** Toda la lógica de BD y parsing en un solo módulo.

### 1.1 `parseCsvText(text: string)`

```typescript
export function parseCsvText(text: string): { rows: CsvRow[]; parseErrors: string[] }
```

- Normalizar `\r\n` → `\n`, split por `\n`
- Descartar última fila si está vacía
- Primera fila = header; detectar índices de: `nombre`, `apellido`, `empresa`, `email`, `fecha_evento`
- Si faltan columnas requeridas → retornar `{ rows: [], parseErrors: ["Header inválido..."] }`
- Por cada fila de datos: split por `,`, validar que tenga al menos tantas columnas como el header
- Validar `email` contiene `@` y dominio, `nombre`/`apellido`/`empresa` no vacíos
- Fila inválida → agregar a `parseErrors[]` con número de fila y razón; no incluir en `rows`
- Columnas extra ignoradas

### 1.2 `generateUniqueToken(maxAttempts = 3)`

```typescript
export async function generateUniqueToken(maxAttempts = 3): Promise<string>
```

- Loop hasta `maxAttempts`: `randomBytes(4).toString("hex")`
- Verificar con `prisma.contact.findFirst({ where: { token } })`
- Si no existe → retornar token
- Si todas las attempts fallan → lanzar `Error("No se pudo generar token único")`

### 1.3 `importContactsFromCsv(rows: CsvRow[])`

```typescript
export async function importContactsFromCsv(rows: CsvRow[]): Promise<ImportResult>
```

- Por cada fila en secuencia:
  1. `findFirst({ where: { email: { equals: row.email, mode: "insensitive" } } })` → si existe: `skipped++`
  2. Si no existe: `generateUniqueToken()` → `prisma.contact.create({ data: { ...row, token, origen: "outreach" } })`
  3. Si `generateUniqueToken` lanza → agregar a `errors[]`, continuar con siguiente fila
- Retornar `{ imported, skipped, errors }`

### 1.4 `getPendingOutreachContacts()` y `getPendingOutreachCount()`

```typescript
export async function getPendingOutreachContacts(): Promise<PendingContact[]>
export async function getPendingOutreachCount(): Promise<number>
```

- `where: { token: { not: null }, enviado_at: null }`
- `select`: id, nombre, apellido, empresa, email, fecha_evento, token
- Count usa la misma condición

### 1.5 `markContactsAsSent(ids: number[])`

```typescript
export async function markContactsAsSent(ids: number[]): Promise<void>
```

- `prisma.contact.updateMany({ where: { id: { in: ids } }, data: { enviado_at: new Date() } })`

**Acceptance**: Unit-testable en aislamiento. `tsc --noEmit` limpio.

---

## Task 2 — `app/api/admin/csv-import/route.ts`

**Archivo nuevo.**

```typescript
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // 1. Auth
  const session = await getAdminSessionFromCookies();
  if (!session) return NextResponse.json({ ok: false, errorCode: "UNAUTHORIZED" }, { status: 401 });

  // 2. Parsear multipart
  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) return 400;

  // 3. Leer texto
  const text = await file.text();

  // 4. parseCsvText
  const { rows, parseErrors } = parseCsvText(text);
  if (rows.length === 0 && parseErrors.length > 0) return 400 con errores

  // 5. Límite 500 filas
  if (rows.length > 500) return 422

  // 6. importContactsFromCsv
  const result = await importContactsFromCsv(rows);

  return { ok: true, data: { ...result, parseErrors } }
}
```

**Acceptance**:
- Sin archivo → 400
- Archivo vacío → 400 con parseErrors
- CSV válido → 200 con imported/skipped/errors
- Auth inválida → 401

---

## Task 3 — `app/api/admin/outreach/route.ts`

**Archivo nuevo.**

```typescript
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // 1. Auth
  const session = await getAdminSessionFromCookies();
  if (!session) return 401;

  // 2. Verificar webhook configurado
  const webhookUrl = process.env.ZAPIER_WEBHOOK_OUTREACH;
  if (!webhookUrl) return 503 { errorCode: "WEBHOOK_NOT_CONFIGURED" }

  // 3. Obtener pendientes
  const contacts = await getPendingOutreachContacts();
  if (contacts.length === 0) return { ok: true, data: { sent: 0 } }

  // 4. Disparar webhooks (fire-and-forget, no await individual)
  const ids = contacts.map(c => c.id);
  for (const contact of contacts) {
    const payload = {
      nombre: contact.nombre, apellido: contact.apellido,
      empresa: contact.empresa, email: contact.email,
      fecha_evento: contact.fecha_evento ?? "",
      invite_url: inviteStartUrl(contact.token),
    };
    fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {}); // fire-and-forget
  }

  // 5. Marcar todos como enviados (independiente de éxito de fetch)
  await markContactsAsSent(ids);

  return { ok: true, data: { sent: contacts.length } }
}
```

**Acceptance**:
- Sin `ZAPIER_WEBHOOK_OUTREACH` → 503
- Sin contactos pendientes → `{ sent: 0 }` sin disparar nada
- Con pendientes → graba `enviado_at`, retorna `{ sent: N }`
- Segunda llamada → `{ sent: 0 }`

---

## Task 4 — `app/(admin)/admin/importar/page.tsx`

**Archivo nuevo. Client Component (`"use client"`).**

**Estado local (useState):**
- `importResult: ImportResult | null`
- `importLoading: boolean`
- `outreachResult: { sent: number } | null`
- `outreachLoading: boolean`
- `pendingCount: number` — inicializado desde prop server-side

**Props del server component wrapper:**
```typescript
// page.tsx es un Server Component que obtiene pendingCount y pasa como prop al Client Component
export default async function ImportarPage() {
  const count = await getPendingOutreachCount();
  return <ImportarClient initialPendingCount={count} />;
}
```

**`ImportarClient` (components/admin/ImportarClient.tsx):**

Sección A — Importar CSV:
```
<form onSubmit={handleImport}>
  <input type="file" accept=".csv" ref={fileRef} />
  <button>Importar</button>
</form>

async function handleImport(e) {
  e.preventDefault();
  const fd = new FormData();
  fd.append("file", fileRef.current.files[0]);
  const res = await fetch("/api/admin/csv-import", { method: "POST", body: fd });
  const json = await res.json();
  setImportResult(json.data);
  router.refresh(); // actualiza pendingCount
}
```

Resultado inline:
- ✅ "X contactos importados, Y omitidos"
- Si errors: lista de errores por fila
- Si parseErrors: "Advertencia: N filas con formato inválido"

Sección B — Disparar campaña:
```
<button onClick={handleOutreach} disabled={pendingCount === 0 || outreachLoading}>
  {outreachLoading ? "Enviando..." : `Disparar campaña · ${pendingCount} pendientes`}
</button>

async function handleOutreach() {
  const res = await fetch("/api/admin/outreach", { method: "POST" });
  const json = await res.json();
  setOutreachResult(json.data);
  setPendingCount(0); // optimistic
  router.refresh(); // confirma desde servidor
}
```

Tras dispatch: "✅ Campaña enviada a N contactos"

Link de plantilla CSV:
```typescript
// Genera el contenido CSV en cliente para descarga
const TEMPLATE = "nombre,apellido,empresa,email,fecha_evento\nEjemplo,García,TechCo,ejemplo@techco.mx,2026-06-15";
<a href={`data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE)}`} download="plantilla.csv">
  Descargar plantilla CSV
</a>
```

---

## Task 5 — `components/admin/AdminNav.tsx`

Agregar ítem en el menú lateral:
```typescript
{ href: "/admin/importar", label: "Importar" }
```
Mantener el patrón visual existente de los otros links del nav.

---

## Verificación Final

1. `npx tsc --noEmit` — sin errores
2. Crear archivo `test.csv` con 3 filas nuevas + 1 email duplicado
3. Subir en `/admin/importar` → resultado: `imported: 3, skipped: 1`
4. `/admin/clientes?status=sin_ingresar` → 3 nuevos contactos con badge gris
5. Clic "Disparar campaña" → `sent: 3`, Zapier recibe 3 payloads
6. Revisar payload en Zapier task history: `invite_url` apunta al dominio correcto
7. Segunda disparo → `sent: 0`
8. Subir mismo CSV → `skipped: 4`

---

## Gotchas

1. **`"use client"` en la page**: La page de importar necesita estado para mostrar resultados del fetch. Se resuelve con el patrón Server Component wrapper + Client Component interior.

2. **`router.refresh()` en Next.js App Router**: Requiere `useRouter` de `next/navigation` (no `next/router`). Refresca los Server Components sin full reload.

3. **`file instanceof Blob` en el API route**: Next.js 15 retorna el archivo del FormData como un `File` (subclase de `Blob`). La verificación `instanceof Blob` cubre ambos. Usar `file.text()` para leer el contenido.

4. **Token collision en seed**: El seed ya tiene `token: "abc12345"` para Juan Pérez. Si alguien importa un CSV y el generador produce ese token, habrá colisión — el retry de `generateUniqueToken` lo maneja. Probabilidad: 1 en 4,294,967,296 por intento.

5. **`enviado_at` vs disparo real**: Marcar `enviado_at` antes de confirmar que Zapier recibió el webhook es un trade-off intencional (MVP). Si Zapier tiene downtime, el contacto quedará marcado y no recibirá el correo. Para producción se recomienda verificar el status code del fetch.
