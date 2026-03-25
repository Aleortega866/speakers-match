# Spec: Migración Outreach — Zapier+Gmail → Mailchimp Marketing API

**Generated**: 2026-03-25
**Branch**: feat/mailchimp-integration
**Complexity**: Medium

---

## Overview

Reemplazar el webhook de Zapier+Gmail usado en la campaña de outreach por una integración directa con la Mailchimp Marketing API (plan gratuito). Cada vez que el admin dispara la campaña desde `/admin/importar`, el sistema upserta los contactos pendientes en Mailchimp, crea un segmento estático, crea una campaña usando un template creado por el cliente en Mailchimp, la envía, y solo entonces marca los contactos como enviados en la BD. Zapier permanece únicamente para la detección de citas en Calendly.

---

## Contexto del sistema actual

- **`lib/admin/outreach.ts`** — `getPendingOutreachContacts()`, `markContactsAsSent()`
- **`app/api/admin/outreach/route.ts`** — endpoint POST que actualmente llama `ZAPIER_WEBHOOK_OUTREACH` fire-and-forget por cada contacto
- **`components/admin/ImportarClient.tsx`** — botón "Disparar campaña" + toasts de resultado
- **`lib/site.ts`** — `inviteStartUrl(token)` genera `https://speakers-match.vercel.app/?t=TOKEN`

---

## Decisiones de diseño

| Decisión | Elección | Razón |
|----------|----------|-------|
| Template de correo | Editable en Mailchimp UI | El cliente lo controla sin tocar código |
| Error handling | Abortar todo si falla cualquier paso | Solo marcar enviados si Mailchimp confirma el envío |
| Política de envío | Consistencia controlada (envío atómico funcional) | Si falla antes de enviar, no se marca nada; si falla post-send, se reconcilia |
| Concurrencia | Bloqueo de ejecución por `outreach_run_id` | Evita doble click y campañas duplicadas |
| Setup del template | El plan incluye instrucciones paso a paso | El template no existe aún en la cuenta |
| Envío síncrono vs async | Síncrono | Permite confirmar éxito antes de marcar en BD |
| Librería Mailchimp | Ninguna (fetch nativo) | Sin dependencias externas |

---

## Arquitectura

### Flujo completo

```
Admin click "Disparar campaña"
    → POST /api/admin/outreach
        1. Validar sesión admin
        2. Validar 6 env vars de Mailchimp → 503 si falta alguna
        3. Adquirir lock de ejecución (si ya hay corrida activa → 409 OUTREACH_ALREADY_RUNNING)
        4. Preflight remoto (template, audience y from email válidos)
        5. getPendingOutreachContacts() → contacts[]
        6. Si contacts.length === 0 → { ok: true, data: { sent: 0 } }
        7. runMailchimpOutreach(contacts)
            a. Para cada contacto: upsertMember() con merge fields
            b. createStaticSegment() con emails de los contactos → segmentId
            c. createCampaign(segmentId) referenciando MAILCHIMP_TEMPLATE_ID → campaignId
            d. sendCampaign(campaignId)
        8. Si paso 7 lanza error → 500, nadie marcado como enviado
        9. markContactsAsSent(ids)
       10. Si 9 falla, guardar reconciliation pendiente con campaignId
       11. { ok: true, data: { sent: contacts.length, runId, campaignId } }
       12. Liberar lock
```

### Archivos nuevos

#### `lib/mailchimp.ts`
Cliente HTTP low-level sobre Mailchimp API v3. Todas las funciones lanzan `Error` si el status no es 2xx.

```typescript
const BASE = `https://${process.env.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0`;
const AUTH = `Basic ${Buffer.from(`key:${process.env.MAILCHIMP_API_KEY}`).toString("base64")}`;

// Upsert miembro en audience (PUT por subscriber hash = md5(email.toLowerCase()))
export async function upsertMember(email: string, mergeFields: {
  FNAME: string; LNAME: string; EMPRESA: string; INVITE_URL: string;
}): Promise<void>

// Crear segmento estático con lista de emails → retorna segment_id
export async function createStaticSegment(
  listId: string, name: string, emails: string[]
): Promise<number>

// Crear campaña con template y segmento → retorna campaign_id
export async function createCampaign(
  listId: string, segmentId: number, subject: string,
  templateId: number, fromEmail: string, fromName: string
): Promise<string>

// Enviar campaña (irreversible)
export async function sendCampaign(campaignId: string): Promise<void>
```

#### `lib/admin/mailchimpOutreach.ts`
Orquestación de alto nivel.

```typescript
export async function runMailchimpOutreach(
  contacts: PendingContact[]
): Promise<{ sent: number }>
// Llama en orden: upsertMember × N → createStaticSegment → createCampaign → sendCampaign
// Cualquier error se propaga sin capturar (el route lo maneja)
```

### Archivos modificados

#### `app/api/admin/outreach/route.ts`
- Eliminar referencia a `ZAPIER_WEBHOOK_OUTREACH`
- Validar 6 env vars de Mailchimp al inicio → 503 con `errorCode: MAILCHIMP_NOT_CONFIGURED`
- Reemplazar loop de fetch-zapier con `await runMailchimpOutreach(contacts)`
- `markContactsAsSent` solo se llama si `runMailchimpOutreach` no lanza error

#### `.env.local`
```bash
# Eliminar:
ZAPIER_WEBHOOK_OUTREACH=...

# Agregar:
MAILCHIMP_API_KEY=
MAILCHIMP_AUDIENCE_ID=
MAILCHIMP_SERVER_PREFIX=   # ej. us1, us21
MAILCHIMP_FROM_EMAIL=
MAILCHIMP_FROM_NAME=
MAILCHIMP_TEMPLATE_ID=     # ID numérico del template creado en Mailchimp
```

---

## Variables de entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `MAILCHIMP_API_KEY` | API key de Mailchimp | `abc123...` |
| `MAILCHIMP_AUDIENCE_ID` | ID del Audience (lista) | `a1b2c3d4e5` |
| `MAILCHIMP_SERVER_PREFIX` | Prefijo del servidor | `us1` |
| `MAILCHIMP_FROM_EMAIL` | Email remitente verificado en Mailchimp | `hola@speakermatch.mx` |
| `MAILCHIMP_FROM_NAME` | Nombre del remitente | `Equipo SpeakerMatch` |
| `MAILCHIMP_TEMPLATE_ID` | ID numérico del template | `12345` |

---

## Setup one-time — Template en Mailchimp (instrucciones para el cliente)

El plan de implementación incluirá estas instrucciones paso a paso:

1. **Crear merge fields en el Audience:**
   - `EMPRESA` (tipo: Text)
   - `INVITE_URL` (tipo: Text)

2. **Crear template:**
   - Mailchimp → Content → Templates → Create Template → Code your own
   - Pegar el HTML del correo (ya diseñado) con merge tags:
     - `*|FNAME|*` → nombre
     - `*|EMPRESA|*` → empresa
     - `*|INVITE_URL|*` → link de invitación
   - Guardar → copiar el `template_id` de la URL

3. **Guardar `template_id`** en `.env.local` y en Vercel env vars.

---

## Manejo de errores

| Escenario | Comportamiento |
|-----------|---------------|
| 0 contactos pendientes | Retorna `{ sent: 0 }` sin llamar Mailchimp |
| Env var faltante | 503 `MAILCHIMP_NOT_CONFIGURED` |
| Email duplicado en Mailchimp | `upsertMember` usa PUT — actualiza sin error |
| Mailchimp rechaza API call | Lanza `Error`, aborta flujo, 500 al cliente |
| Campaign send falla | `markContactsAsSent` no se llama, admin puede reintentar |
| Falla post-send al marcar BD | Se registra `outreach_reconciliation` con `campaignId` para reparación manual/automática |
| `contacts.length > 500` | Se aborta con 422 `MAILCHIMP_FREE_LIMIT_EXCEEDED` (no envío parcial en demo) |
| Doble disparo simultáneo | 409 `OUTREACH_ALREADY_RUNNING` |
| 429 / 5xx Mailchimp | Hasta 3 reintentos con backoff exponencial, luego error 502 |

### Regla de consistencia (aprobada)

- El endpoint es **todo o nada antes del send**: si falla cualquier operación antes de `sendCampaign`, no se marca ningún contacto como enviado.
- Si el envío ya ocurrió y falla la actualización de BD, se crea una tarea de reconciliación para no perder trazabilidad.
- No se implementa envío parcial ni reporte por contacto en esta fase.
- El reintento se hace ejecutando nuevamente "Disparar campaña" tras corregir la causa del error.

### Contrato de respuesta del endpoint

- Éxito: `{ ok: true, data: { sent, runId, campaignId, warning? } }`
- Error de configuración: `503 MAILCHIMP_NOT_CONFIGURED`
- Error de concurrencia: `409 OUTREACH_ALREADY_RUNNING`
- Error de límite plan free: `422 MAILCHIMP_FREE_LIMIT_EXCEEDED`
- Error de proveedor (Mailchimp): `502 MAILCHIMP_UPSTREAM_ERROR`
- En errores upstream, al cliente se expone solo `errorCode` y mensaje genérico; el detalle HTTP real de Mailchimp se guarda en logs internos con `runId`.

### Persistencia operativa mínima

- `outreach_run_lock` (tabla o registro único):
  - `key` (único, valor fijo `mailchimp_outreach`)
  - `run_id` (uuid)
  - `started_at` (datetime)
  - `expires_at` (datetime, TTL recomendado 15 min)
- `outreach_reconciliation`:
  - `id`
  - `run_id`
  - `campaign_id`
  - `contact_ids_json`
  - `status` (`pending` inicial)
  - `created_at`

---

## UX — Sin cambios visibles

- El botón "Disparar campaña" y los toasts permanecen igual
- Solo cambia el mensaje de error interno: `MAILCHIMP_NOT_CONFIGURED`
- El comportamiento síncrono puede hacer el botón un poco más lento (~2-3s) pero es aceptable

---

## Lo que se elimina

- `ZAPIER_WEBHOOK_OUTREACH` de `.env.local` y Vercel
- El Zap de Gmail en Zapier (documentado como paso manual en el plan)
- El Zap de Calendly **no se toca** — sigue funcionando igual

---

## Testing

1. Importar CSV con 1-2 contactos de prueba
2. Verificar que aparecen en Mailchimp Audience con merge fields correctos
3. Verificar que llega el correo con nombre, empresa e `invite_url` correctos
4. Verificar que `enviado_at` se graba en BD
5. Reintentar campaña — debe retornar `{ sent: 0 }` (ya no hay pendientes)
6. Probar con env var faltante — debe retornar 503
7. Simular doble click del botón — una request debe retornar 409
8. Forzar 429 mockeando Mailchimp — validar reintentos y error 502 final
9. Simular fallo en `markContactsAsSent` tras send — validar registro de reconciliación

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|-----------|
| Mailchimp rate limit (upsert por contacto) | Reintentos con backoff; para producción evaluar batch ops |
| Template ID incorrecto | Preflight remoto: verificar existencia de template antes del envío |
| From email no verificado en Mailchimp | El plan incluye instrucción para verificar el dominio |
| Segmento con nombre duplicado | Incluir timestamp en el nombre del segmento: `outreach_2026-03-25_1430` |

---

## Criterios de éxito (demo)

- `>= 95%` de corridas de outreach completan sin error en ambiente de staging.
- `p95` de duración del endpoint `POST /api/admin/outreach` menor a `10s` para lotes de hasta 100 contactos.
- Todo intento genera logs con `runId`, `contactsCount`, `segmentId` y `campaignId` (si aplica).

---

## Rollback

Si la integración falla en producción:
1. Restaurar `ZAPIER_WEBHOOK_OUTREACH` en Vercel env vars
2. Hacer revert del commit en `app/api/admin/outreach/route.ts`
3. Reactivar el Zap de Gmail en Zapier
