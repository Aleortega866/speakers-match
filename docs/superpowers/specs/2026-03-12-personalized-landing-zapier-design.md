# Spec: Landing Personalizado + Automatización Zapier — Speaker Match

**Fecha:** 2026-03-12
**Proyecto:** Speaker Match (Speakers México)
**Estado:** Aprobado

---

## Contexto

El landing de Speaker Match es visitado por contactos pre-identificados (outreach via email, QR y links directos) y también puede recibir tráfico orgánico. Para los contactos pre-identificados, sus datos (nombre, apellido, empresa, correo) están almacenados en Google Sheets.

El objetivo es:
1. Personalizar el landing con el nombre del contacto y precargar los campos del formulario
2. Rastrear el progreso de cada contacto a través del funnel (link enviado → form iniciado → form completado → llamada agendada)
3. Automatizar los correos de seguimiento según el escenario en que se encuentre el contacto

---

## Arquitectura General

```
Google Sheets (fuente de verdad + panel de leads)
        ↑↓
      Zapier (automatización de flujos y correos)
        ↑↓
  Next.js API Routes (/api/contact, /api/event)
        ↑↓
  Frontend (IntakeForm + MatchForm + /gracias)
        ↑↓
    Calendly (agendado de llamadas)
```

---

## 1. Google Sheet — Estructura

**Hoja:** `contacts`

| Columna | Tipo | Descripción |
|---|---|---|
| `token` | string (8 chars alfanuméricos) | Identificador único por contacto. Generado por Zapier al enviar el email inicial. Solo existe para contactos de outreach. |
| `nombre` | string | Primer nombre |
| `apellido` | string | Apellido |
| `empresa` | string | Empresa del contacto (editable por el usuario en el form) |
| `email` | string | Correo corporativo |
| `enviado_at` | datetime | Cuando se envió el link personalizado |
| `form_started_at` | datetime | Cuando el usuario completó el paso de email (paso 3 del IntakeForm) |
| `form_completed_at` | datetime | Cuando el usuario llegó a /gracias con el formulario completo |
| `calendly_booked_at` | datetime | Cuando el usuario agendó en Calendly |
| `correo_abandono_enviado` | string ("sí"/"no") | Flag para no enviar duplicados del correo de abandono |
| `origen` | string ("outreach"/"organico") | Distingue el tipo de contacto para segmentación |

Esta hoja funciona como panel de leads nativo de Sheets (filtros y vistas por estado del funnel).

**Contactos orgánicos:** Cuando un usuario sin token completa el paso de email (paso 3), Zapier crea una fila nueva en Sheets con `origen=organico`. No tienen `token` ni `enviado_at`.

---

## 2. URL Personalizada y Token

- Formato: `speakersmatch.com/?t={token}` donde `token` es 8 caracteres alfanuméricos (ej: `a3f2b1c9`)
- El token es opaco — no contiene datos del contacto en texto plano
- Si no hay token en la URL, el formulario funciona normalmente con campos vacíos (tráfico orgánico)
- El token se persiste en `speakerMatchStore` (ver Sección 4) para sobrevivir la navegación entre páginas

---

## 3. API Routes (Next.js)

### `GET /api/contact?t={token}`

Consulta Google Sheets via Google Sheets API (Service Account).

**Respuesta exitosa (200):**
```json
{ "nombre": "Carlos", "apellido": "López", "empresa": "BBVA", "email": "carlos@bbva.com" }
```

**Respuesta si no existe (404):**
```json
{ "error": "not_found" }
```

**Degradación:** Si la API de Sheets falla (timeout, credenciales inválidas, etc.), la ruta devuelve `503` y el formulario carga vacío. El usuario no ve ningún error — el formulario funciona normalmente.

**Seguridad y rate limiting:** Esta ruta solo devuelve datos si el token existe en el Sheet. Vercel no soporta rate limiting nativo en `vercel.json` — se implementa en un `middleware.ts` en la raíz del proyecto que limita a 30 requests/min por IP usando un contador en memoria (suficiente para un proceso single-instance en Vercel Edge). Para el alcance actual, esto es aceptado como protección adecuada contra abuso automatizado. Un WAF externo queda fuera de alcance.

### `POST /api/event`

Recibe eventos del formulario y los reenvía al webhook de Zapier correspondiente.

**Autenticación:** La ruta verifica el header `Origin` o `Referer` del request para confirmar que proviene del mismo dominio (same-origin check server-side). No se usa una variable de entorno secreta en el cliente porque cualquier valor en `NEXT_PUBLIC_*` es visible en el bundle de JavaScript. El same-origin check es suficiente para el alcance actual — evita abuso casual desde curl/scripts externos, pero no es protección contra ataques sofisticados, lo cual se acepta como riesgo.

**Body para `form_started`** (se dispara al completar el paso de email — paso 3 del IntakeForm):
```json
{
  "type": "form_started",
  "token": "a3f2b1c9",
  "data": {
    "nombre": "Carlos",
    "apellido": "López",
    "empresa": "BBVA",
    "email": "carlos@bbva.com"
  }
}
```
> `token` puede ser `null` para tráfico orgánico. En ese caso, Zapier crea una fila nueva en Sheets identificada por email. `fecha` no está disponible en este evento.

**Body para `form_completed`** (se dispara al montar `/gracias`):
```json
{
  "type": "form_completed",
  "token": "a3f2b1c9",
  "data": {
    "nombre": "Carlos",
    "apellido": "López",
    "empresa": "BBVA",
    "email": "carlos@bbva.com",
    "fecha": "2026-06-15"
  }
}
```

**Comportamiento:** La ruta llama al webhook de Zapier de forma fire-and-forget (no espera respuesta). Siempre devuelve `200` al frontend para no bloquear la UX.

---

## 4. Cambios en el Frontend

### `speakerMatchStore` — Extensión del tipo y funciones

Se agrega el campo `token?: string` a `SpeakerMatchData` y se actualizan las tres funciones del store para manejarlo:

```typescript
export interface SpeakerMatchData {
  token?: string;          // nuevo
  intake: SpeakerMatchIntakeData;
  matchAnswers: string[];
}
```

`getDefaultData()` retorna `token: undefined`.

`writeSpeakerMatchData(partial)` debe incluir `token` en el merge:
```typescript
const merged: SpeakerMatchData = {
  token: partial.token ?? current.token,   // nuevo
  intake: { ...current.intake, ...(partial.intake ?? {}) },
  matchAnswers: partial.matchAnswers ?? current.matchAnswers,
};
```

`readSpeakerMatchData()` debe leer y devolver `token` del JSON parseado:
```typescript
return {
  token: typeof parsed.token === "string" ? parsed.token : undefined,  // nuevo
  intake: { ...base.intake, ...(parsed.intake ?? {}) },
  matchAnswers: Array.isArray(parsed.matchAnswers) ? ... : base.matchAnswers,
};
```

### `IntakeForm` — Modificaciones

El `IntakeForm` usa índices 0-based internamente (`currentStep`). La correspondencia con los pasos visibles es:
- `currentStep === 0` → Paso 1: Nombre y Apellido
- `currentStep === 1` → Paso 2: Empresa
- `currentStep === 2` → Paso 3: Email ← trigger de `form_started`
- `currentStep === 3` → Paso 4: Fecha

1. **Suspense boundary:** `IntakeForm` usa `useSearchParams()` internamente, lo que requiere que sea envuelta en `<Suspense>` en `app/page.tsx`. El componente ya existe como `"use client"` y la página ya importa `IntakeForm` directamente — se debe añadir el wrapper.

2. **Al montar:** lee `?t=` de la URL via `useSearchParams()`. Si existe:
   - Persiste el token en `speakerMatchStore` via `writeSpeakerMatchData({ token })`
   - Llama a `GET /api/contact?t={token}`
   - Precarga los campos del formulario con la respuesta
   - Los campos son editables (el contacto puede corregir datos desactualizados)
   - Si la llamada falla o devuelve 404, el formulario carga vacío sin error visible

3. **Al completar el paso de email (`currentStep === 2`, dentro de `handleNext`):**
   - **Antes** de llamar a `setCurrentStep(s => s + 1)`, se dispara `POST /api/event` con `type: "form_started"`. Los valores de `nombre`, `apellido`, `empresa` y `email` se leen directamente del estado de React (`formData`) en ese momento — no del store — para garantizar los valores del render actual sin depender de que el store haya sido escrito
   - La llamada es fire-and-forget — no bloquea la navegación al siguiente paso

4. **Al completar el form (último paso, `currentStep === 3`):** persiste en `speakerMatchStore` como hoy y navega a `/match`.

### `MatchForm` — Sin cambios

### `/gracias` — Modificaciones

1. **Al montar (`useEffect`):**
   - Lee todos los datos del store incluyendo `token`
   - **Guard:** si `data.intake.email` está vacío (usuario navegó directamente a `/gracias` sin completar el form), no se dispara el evento — el `useEffect` retorna sin hacer nada
   - Si el email existe, llama a `POST /api/event` con `type: "form_completed"` y todos los datos
   - La llamada es fire-and-forget

2. **`clearSpeakerMatchData()`:** Se mantiene en el `onClick` del CTA (Calendly), no en el `useEffect` de mount. Esto garantiza que los datos están disponibles para el evento `form_completed` antes de ser borrados.

3. **CTA — Calendly:**
   - El botón placeholder se reemplaza por un link a Calendly con prefill
   - `NEXT_PUBLIC_CALENDLY_URL` contiene la URL base completa del evento (ej: `https://calendly.com/speakersmexico/match`), no solo el slug
   - El link final se construye agregando query params: `{NEXT_PUBLIC_CALENDLY_URL}?name={nombre}+{apellido}&email={email}`
   - Al hacer clic: llama a `clearSpeakerMatchData()` y abre el link (puede ser en nueva pestaña o en el mismo tab según preferencia del equipo)
   - Nota: Calendly tiene un widget embebido y un link directo. Se implementa como link directo primero (más simple); el widget puede añadirse en iteración futura.

---

## 5. Flujos de Zapier

### Flujo 1 — Envío del link personalizado

**Pre-condición:** Las filas de contactos de outreach son creadas manualmente (o via importación desde el CRM/base de datos) en el Sheet con los campos `nombre`, `apellido`, `empresa`, `email`, `origen="outreach"` y `token` vacío. Flujo 1 detecta estas filas y completa el proceso.

```
Trigger: Fila nueva en Sheets donde origen="outreach" y token está vacío
  [Este filtro evita que el flujo se dispare en filas de contactos orgánicos
   creadas por el Flujo 2, que tienen origen="organico"]
  → Formatter: Genera token alfanumérico de 8 caracteres
  → Sheets: Escribe token y enviado_at en la fila
  → Email: Envía email con link speakersmatch.com/?t={token}
```

### Flujo 2 — Form iniciado (registro en Sheets)
```
Trigger: Webhook POST desde /api/event (type: "form_started")
  → Sheets: Busca fila por token (si existe) o por email
  → Si encontró fila:
      → Sheets: Escribe form_started_at (solo si está vacío — no sobreescribir)
  → Si NO encontró fila (contacto orgánico):
      → Sheets: Crea nueva fila con nombre, apellido, empresa, email,
                form_started_at, origen="organico"
```

### Flujo 3 — Form completado (invitación a agendar)
```
Trigger: Webhook POST desde /api/event (type: "form_completed")
  → Sheets: Busca fila por token (si existe) o por email
  → Sheets: Escribe form_completed_at + actualiza nombre, apellido, empresa, email, fecha
  → Delay: 30 minutos
  → Sheets: Re-lee la fila para verificar estado actual
  → Filter: Continuar solo si calendly_booked_at está vacío
  → Email: "Tu propuesta de speakers está lista — agenda tu llamada" con link Calendly
```

### Flujo 4 — Llamada agendada en Calendly
```
Trigger: Webhook de Calendly (event.created)
  → Sheets: Busca fila por email del invitado (campo "invitee.email" de Calendly)
  → Sheets: Escribe calendly_booked_at
  [Calendly envía automáticamente confirmación al invitado — no se duplica]
```

### Flujo 5 — Recordatorio de abandono
```
Trigger: Schedule (2x al día — 10:00 AM y 4:00 PM hora Ciudad de México)
  → Sheets: Lee todas las filas donde:
      form_started_at ≠ vacío
      form_completed_at = vacío
      form_started_at es más de 2 horas atrás  ← [fecha anterior a NOW() - 2h]
      correo_abandono_enviado ≠ "sí"
  → Loop (por cada fila encontrada):
      → Si tiene token: email con link speakersmatch.com/?t={token}
      → Si no tiene token: email con link speakersmatch.com/ (sin precarga)
      → Sheets: Marca correo_abandono_enviado = "sí"
```

---

## 6. Tabla de Escenarios y Emails

| Escenario | Quién envía | Timing | Una sola vez |
|---|---|---|---|
| Link enviado al contacto (outreach) | Zapier (Flujo 1) | Al crear fila | Sí |
| Form iniciado, no completado | Zapier (Flujo 5) | 2+ horas después | Sí (flag) |
| Form completado, no agendó en 30 min | Zapier (Flujo 3) | 30 min post-completar | Sí (condición) |
| Llamada agendada | Calendly | Inmediato | Sí |
| Recordatorio 24h antes | Calendly | 24h antes | Sí |

---

## 7. Variables de Entorno

| Variable | Scope | Descripción |
|---|---|---|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Server | JSON completo del Service Account de Google |
| `GOOGLE_SHEET_ID` | Server | ID del Google Sheet (de la URL: `/d/{ID}/`) |
| `ZAPIER_WEBHOOK_FORM_STARTED` | Server | URL del webhook de Zapier para evento form_started |
| `ZAPIER_WEBHOOK_FORM_COMPLETED` | Server | URL del webhook de Zapier para evento form_completed |
| `NEXT_PUBLIC_CALENDLY_URL` | Public | URL base completa del evento de Calendly (ej: `https://calendly.com/speakersmexico/match`) |

> Nota: No existe `INTERNAL_SECRET` — la autenticación de `/api/event` se hace via same-origin check (ver Sección 3).

---

## 8. Degradación y Casos Edge

| Situación | Comportamiento |
|---|---|
| Token inválido o no encontrado en Sheets | Formulario carga vacío, experiencia normal sin error |
| Google Sheets API caída al cargar form | Formulario carga vacío, los eventos igual se envían a Zapier |
| `/api/event` falla | Fire-and-forget: el usuario no ve error, el evento se pierde silenciosamente |
| Usuario edita empresa/email en el form | Los datos actualizados se envían en `form_completed` y sobreescriben el Sheet |
| Contacto orgánico (sin token) | Zapier crea nueva fila en Sheets al recibir `form_started` |
| Usuario abre el link dos veces | Zapier Flujo 2 no sobreescribe `form_started_at` si ya existe |
| Usuario agenda en < 30 min post-form | El delay del Flujo 3 + condición `calendly_booked_at = vacío` evita el email innecesario |
| `useSearchParams` en App Router | `IntakeForm` debe estar envuelta en `<Suspense fallback={<div className="h-14" />}>` en `app/page.tsx` — el fallback es un div con la misma altura aproximada del botón inicial para evitar layout shift |

---

## 9. Criterios de Aceptación

**URL Personalizada:**
- Dado un token válido en la URL, los campos nombre/apellido/empresa/email aparecen pre-poblados al llegar al paso correspondiente del form
- Dado un token inválido, el formulario carga vacío sin mostrar error al usuario
- Dado ningún token, el formulario carga vacío y funciona normalmente

**Evento form_started:**
- Se dispara exactamente una vez por sesión, al completar el paso de email (paso 3)
- Incluye nombre, apellido, empresa y email en el body
- Se dispara tanto para contactos con token como para orgánicos

**Evento form_completed:**
- Se dispara al montar `/gracias`, antes de que el usuario interactúe con el CTA
- Incluye todos los datos del form incluyendo `fecha`
- `clearSpeakerMatchData()` se llama en el onClick del botón de Calendly, no al montar

**CTA Calendly:**
- El link incluye `name` y `email` como query params de prefill
- Al hacer clic se limpia el store y se abre Calendly

**Degradación:**
- Si `/api/contact` responde con error, el form carga vacío en menos de 3 segundos (timeout configurado)
- La aplicación nunca muestra un error visible al usuario por fallos de la API interna

---

## 10. Fuera de Alcance (por ahora)

- Panel de leads custom (sustituido por Google Sheets con filtros)
- Autenticación / protección del landing (es público)
- A/B testing de mensajes de email
- Tracking de apertura de emails
- Widget embebido de Calendly (se usa link directo en primera iteración)
- Re-envío de eventos fallidos (no hay cola de reintentos)
