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
| Política de envío | Atómico estricto (todo o nada) | Evita desalineación entre BD y Mailchimp durante el demo |
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
        3. getPendingOutreachContacts() → contacts[]
        4. Si contacts.length === 0 → { ok: true, data: { sent: 0 } }
        5. runMailchimpOutreach(contacts)
            a. Para cada contacto: upsertMember() con merge fields
            b. createStaticSegment() con emails de los contactos → segmentId
            c. createCampaign(segmentId) referenciando MAILCHIMP_TEMPLATE_ID → campaignId
            d. sendCampaign(campaignId)
        6. Si paso 5 lanza error → 500, nadie marcado como enviado
        7. markContactsAsSent(ids)
        8. { ok: true, data: { sent: contacts.length } }
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
| `contacts.length > 500` | Warning en respuesta: `{ warning: "Cercano al límite del plan gratuito" }` |

### Regla de atomicidad (aprobada)

- El endpoint es **todo o nada**: si falla cualquier operación de Mailchimp para cualquier contacto, no se marca ningún contacto como enviado.
- No se implementa envío parcial ni reporte por contacto en esta fase.
- El reintento se hace ejecutando nuevamente "Disparar campaña" tras corregir la causa del error.

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

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|-----------|
| Mailchimp rate limit (upsert por contacto) | Para demo con <100 contactos no es problema; para producción implementar batch upsert |
| Template ID incorrecto | Validar que `MAILCHIMP_TEMPLATE_ID` existe al inicio del route |
| From email no verificado en Mailchimp | El plan incluye instrucción para verificar el dominio |
| Segmento con nombre duplicado | Incluir timestamp en el nombre del segmento: `outreach_2026-03-25_1430` |

---

## Rollback

Si la integración falla en producción:
1. Restaurar `ZAPIER_WEBHOOK_OUTREACH` en Vercel env vars
2. Hacer revert del commit en `app/api/admin/outreach/route.ts`
3. Reactivar el Zap de Gmail en Zapier
