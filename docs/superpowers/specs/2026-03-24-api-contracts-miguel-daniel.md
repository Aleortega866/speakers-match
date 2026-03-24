# Contratos de API — Miguel necesita de Daniel

**Fecha:** 2026-03-24
**Proyecto:** Speakers Match
**Contexto:** Lista definitiva de endpoints que el frontend (Miguel) consume del backend (Daniel).
Revisada contra todo el código fuente — no hay más endpoints fuera de estos 6.

> Automatizaciones Zapier y Calendly son responsabilidad de Miguel (no-code) y no están incluidas aquí.

---

## Endpoints

### `POST /api/admin/auth/login`

Autentica al admin. Si las credenciales son válidas crea una sesión en BD y setea una cookie `HttpOnly` de sesión.

**Envío:**
```json
{ "email": "admin@ejemplo.com", "password": "Admin123!" }
```

**Respuesta exitosa `200`:**
```json
{ "ok": true, "data": { "email": "admin@ejemplo.com" } }
```
+ Cookie `HttpOnly` de sesión seteada automáticamente.

**Errores:**
```json
{ "ok": false, "errorCode": "AUTH",       "message": "Credenciales incorrectas" }      // 401
{ "ok": false, "errorCode": "VALIDATION", "message": "Email y contraseña requeridos" } // 422
{ "ok": false, "errorCode": "FORBIDDEN",  "message": "Forbidden" }                     // 403
```

---

### `POST /api/admin/auth/logout`

Invalida la sesión activa y limpia la cookie.

**Envío:** sin body

**Respuesta `200`:**
```json
{ "ok": true }
```
+ Cookie de sesión limpiada automáticamente.

---

### `GET /api/contact?t={token}`

Devuelve los datos del contacto para precargar el IntakeForm cuando el usuario llega por un link personalizado `/start?t={token}`.

**Envío:** query param `?t=ABC12345`

**Respuesta exitosa `200`:**
```json
{
  "nombre": "Laura",
  "apellido": "García",
  "empresa": "Acme Corp",
  "email": "laura@acme.com",
  "fecha_evento": "2026-05-10"
}
```

**Errores:**
```json
{ "error": "Token requerido" }        // 400
{ "error": "Contacto no encontrado" } // 404
```

---

### `POST /api/event`

Registra un evento del flujo SpeakerMatch en BD. Se llama en dos momentos:
- Al iniciar el IntakeForm (`form_started`) — desde `IntakeForm.tsx`
- Al llegar a `/gracias` (`form_completed`) — desde `gracias/page.tsx`

**Envío — `form_started`:**
```json
{
  "type": "form_started",
  "token": "ABC12345",
  "nombre": "Laura",
  "apellido": "García",
  "empresa": "Acme Corp",
  "email": "laura@acme.com",
  "fecha_evento": "2026-05-10"
}
```

**Envío — `form_completed`:**
```json
{
  "type": "form_completed",
  "token": "ABC12345",
  "email": "laura@acme.com",
  "matchAnswers": ["Motivacional", "Presencial", "500 personas"]
}
```

> `token` o `email` — al menos uno requerido. El resto de campos son opcionales pero se recomienda enviarlos siempre que estén disponibles.

**Respuesta exitosa `200`:**
```json
{ "ok": true }
```

**Errores:**
```json
{ "error": "Se requiere token o email" }                          // 400
{ "error": "type debe ser uno de: form_started, form_completed" } // 400
{ "error": "Forbidden" }                                          // 403
```

---

### `POST /api/admin/csv-import`

Recibe un archivo CSV como `multipart/form-data`, parsea las filas, deduplica por email y crea los contactos nuevos en BD. Máximo 500 filas por importación.

**Envío:** `multipart/form-data`, campo `file` con el CSV.

Formato del CSV:
```
nombre,apellido,empresa,email,fecha_evento
Laura,García,Acme Corp,laura@acme.com,2026-05-10
Carlos,López,Innovacorp,c.lopez@innovacorp.mx,
```
> `fecha_evento` es opcional. Emails duplicados se omiten silenciosamente.

**Respuesta exitosa `200`:**
```json
{
  "ok": true,
  "data": {
    "imported": 48,
    "skipped": 2,
    "errors": [{ "row": 5, "reason": "Email inválido" }],
    "parseErrors": []
  }
}
```

**Errores:**
```json
{ "ok": false, "errorCode": "NO_FILE",       "message": "Se requiere un archivo CSV" }      // 400
{ "ok": false, "errorCode": "NO_VALID_ROWS", "message": "No se encontraron filas válidas",
  "data": { "parseErrors": [] } }                                                            // 400
{ "ok": false, "errorCode": "TOO_MANY_ROWS", "message": "Máximo 500 filas por importación" } // 422
{ "ok": false, "errorCode": "UNAUTHORIZED",  "message": "No autorizado" }                   // 401
```

---

### `POST /api/admin/outreach`

Busca todos los contactos con token que no han recibido correo (`enviado_at IS NULL`), dispara el webhook de Zapier con el link personalizado de cada uno (fire-and-forget) y los marca como enviados en BD.

**Envío:** sin body — la sesión viaja en cookie.

**Respuesta exitosa `200`:**
```json
{ "ok": true, "data": { "sent": 45 } }
```
> `sent: 0` no es error — simplemente no había contactos pendientes.

**Errores:**
```json
{ "ok": false, "errorCode": "UNAUTHORIZED",           "message": "No autorizado" }                        // 401
{ "ok": false, "errorCode": "WEBHOOK_NOT_CONFIGURED", "message": "ZAPIER_WEBHOOK_OUTREACH no configurado" } // 503
```

---

## Resumen

| Endpoint | Método | Llamado desde | Para qué |
|---|---|---|---|
| `/api/admin/auth/login` | POST | `AdminLoginForm.tsx` | Login del admin |
| `/api/admin/auth/logout` | POST | `AdminLogoutButton.tsx` | Cerrar sesión |
| `/api/contact` | GET | `IntakeForm.tsx` | Precargar datos por token |
| `/api/event` | POST | `IntakeForm.tsx` + `gracias/page.tsx` | Registrar form_started y form_completed |
| `/api/admin/csv-import` | POST | `ImportarClient.tsx` | Subir CSV de contactos |
| `/api/admin/outreach` | POST | `ImportarClient.tsx` | Disparar campaña de emails |
