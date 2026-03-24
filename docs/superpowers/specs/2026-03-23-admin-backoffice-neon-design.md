# Diseno de Integracion del Backoffice Admin (Neon + Next.js)

Fecha: 2026-03-23  
Estado: Aprobado con condiciones (pendiente de implementacion)  
Alcance: Integrar el demo `docs/test.html` al producto real con autenticacion y autorizacion reales, datos 100% en Neon, y rutas admin aisladas en `/(admin)`.

## 1) Objetivo del proyecto

Integrar un modulo de administracion para Speakers Match con:

- Login admin real.
- Proteccion real de rutas y endpoints por sesion y rol.
- Vistas de clientes y conferencistas basadas en el diseno del demo.
- Datos reales en Neon (sin mocks ni dummies en runtime).

La meta es llegar a una primera version casi-produccion en arquitectura, seguridad base y contratos de datos, sin intentar cubrir casos avanzados fuera del alcance actual.

## 2) Alcance funcional confirmado

### En alcance

- Ruta y layout admin aislados bajo `app/(admin)`.
- Rutas:
  - `/admin/login`
  - `/admin`
  - `/admin/clientes`
  - `/admin/clientes/[id]`
  - `/admin/conferencistas`
- Auth real con sesion persistida por cookie segura.
- Rol `admin` obligatorio para UI admin y `/api/admin/*`.
- Datos reales en Neon para:
  - usuarios admin
  - clientes
  - respuestas de cuestionario
  - conferencistas
  - matches cliente-conferencista
- Busqueda y paginacion en clientes y conferencistas.

### Fuera de alcance (esta fase)

- Motor de matching avanzado en tiempo real.
- Panel de edicion CRUD completo de conferencistas/clientes.
- Multi-rol complejo (beyond `admin`).
- Reporteria avanzada, exportaciones masivas y BI.

## 3) Estado actual del codigo y restricciones

Se detecta base util ya implementada:

- `lib/prisma.ts` ya conecta Prisma con Neon via `DATABASE_URL`.
- `lib/db.ts` ya ofrece health check de DB.
- `lib/contacts.ts` y APIs existentes ya trabajan con datos reales.
- `.env.example` ya contempla `DATABASE_URL` y `DIRECT_URL`.

Implicacion: no se debe crear una segunda capa de conexion ni patrones paralelos. La integracion admin debe extender los patrones existentes.

## 3.1 Estrategia de migracion y fuente de verdad

Para evitar doble fuente de verdad con el esquema actual, esta fase adopta:

- **Source of truth para clientes: tabla existente `Contact` (Prisma model actual).**
- Campos de respuestas en esta fase: `match_answers` en `Contact`.
- **No crear `clients` ni `questionnaire_responses` en esta primera implementacion.**

La evolucion a tablas normalizadas (si se requiere) se tratara en una fase posterior con:

- migracion explicita,
- backfill trazable,
- fecha de corte,
- compatibilidad temporal controlada.

## 4) Arquitectura propuesta

### 4.1 Frontend/SSR (Next.js App Router)

- Crear route group `app/(admin)` para aislar navegacion y estilos del backoffice respecto al sitio publico.
- Definir dos layouts:
  - `AdminAuthLayout` para `/admin/login`.
  - `AdminLayout` para secciones autenticadas.
- Migrar el demo `docs/test.html` a componentes React desacoplados:
  - tabla de clientes
  - detalle de cliente
  - cards de matches
  - listado de conferencistas

### 4.2 Backend (BFF interno del admin)

- Exponer endpoints `app/api/admin/*` para consumo de UI admin.
- Mantener validacion y autorizacion server-side en cada endpoint.
- Reusar `prisma` singleton de `lib/prisma.ts`.

### 4.3 Seguridad y acceso

- Session cookie `httpOnly`, `sameSite=lax`, `secure` en prod.
- Middleware/guard para verificar sesion en `/admin/*`.
- En endpoints `/api/admin/*`, rechazar requests sin sesion o sin rol `admin`.
- Respuestas estandarizadas y sin fuga de detalles sensibles.

## 5) Diseno de rutas

## UI routes

- `/admin/login`  
  Formulario de login admin.

- `/admin`  
  Redirect a `/admin/clientes`.

- `/admin/clientes`  
  Listado paginado y buscable de clientes con cuestionario.

- `/admin/clientes/[id]`  
  Detalle del cliente + respuestas + top matches.

- `/admin/conferencistas`  
  Listado paginado y buscable de conferencistas.

## API routes (Next App Router)

- `POST /api/admin/auth/login`
- `POST /api/admin/auth/logout`
- `GET /api/admin/auth/session`
- `GET /api/admin/clientes?search=&page=&pageSize=`
- `GET /api/admin/clientes/[id]`
- `GET /api/admin/conferencistas?search=&page=&pageSize=`

## 6) Modelo de datos inicial (Neon)

Tablas propuestas para esta fase:

1. `admin_users`
   - `id` (pk)
   - `email` (unique)
   - `password_hash`
   - `role` (`admin`)
   - `active`
   - `created_at`, `updated_at`

2. `admin_sessions`
   - `id` (pk)
   - `user_id` (fk `admin_users.id`)
   - `session_token_hash` (unique)
   - `expires_at`
   - `created_at`
   - `ip`, `user_agent` (opcional recomendado)

3. `Contact` (existente, source of truth en esta fase)
   - Reusar columnas actuales de contacto
   - Reusar `match_answers` como fuente de respuestas en detalle de cliente
   - Reusar marcas de avance (`form_started_at`, `form_completed_at`) para filtros de backoffice

4. `speakers`
   - `id` (pk)
   - `nombre`
   - `especialidad`
   - `bio_short`
   - `active`
   - `created_at`, `updated_at`

5. `client_matches`
   - `id` (pk)
   - `client_id` (fk `Contact.id`)
   - `speaker_id` (fk `speakers.id`)
   - `match_score` (0-100)
   - `top_skill`
   - `skills_breakdown` (jsonb)
   - `created_at`

6. `admin_audit_logs` (obligatorio)
   - `id` (pk)
   - `admin_user_id`
   - `action` (login_success, login_failed, view_client_detail, logout)
   - `resource_type`
   - `resource_id`
   - `metadata` (jsonb)
   - `created_at`

## 6.1 Constraints e indices minimos

- `admin_users.email` unique.
- `admin_sessions.session_token_hash` unique + index por `expires_at`.
- `client_matches` unique compuesto (`client_id`, `speaker_id`).
- Indexes de consulta:
  - `Contact(email)` (si no existe ya),
  - `Contact(form_completed_at)`,
  - `Contact(empresa)`,
  - `speakers(nombre)`,
  - `client_matches(client_id, match_score desc)`.
- FKs con politica explicita:
  - `admin_sessions.user_id` -> `admin_users.id` (`onDelete: Cascade`).
  - `client_matches.client_id` -> `Contact.id` (`onDelete: Cascade`).
  - `client_matches.speaker_id` -> `speakers.id` (`onDelete: Restrict`).

## 7) Contratos de respuesta API

Estandarizar respuesta:

- Exito:
  - `{ ok: true, data: ... }`
- Error:
  - `{ ok: false, errorCode: string, message: string }`

Codigos:

- `400` bad request
- `401` no autenticado
- `403` sin permisos
- `404` no encontrado
- `422` validacion
- `500` error interno

Paginacion (obligatoria en listados):

- Query params:
  - `page` (default `1`, minimo `1`)
  - `pageSize` (default `20`, maximo `100`)
  - `search` (opcional)
- Respuesta:
  - `{ ok: true, data: { items: [...], pagination: { page, pageSize, total, hasNext } } }`
- Parametros invalidos retornan `422`.

## 8) Flujo UX principal

1. Admin abre `/admin`.
2. Si no hay sesion -> redirect `/admin/login`.
3. Login exitoso -> redirect `/admin/clientes`.
4. Ve listado, busca y pagina.
5. Entra a detalle de cliente.
6. Visualiza respuestas y top matches.
7. Navega a `/admin/conferencistas`.
8. Cierra sesion.

## 9) Integracion visual del demo

`docs/test.html` se toma como referencia de:

- jerarquia visual
- composicion de tabla y detalle
- estilo de cards de match

Se migra a React/Next:

- Sin `onclick` inline.
- Sin manipulacion manual de DOM.
- Navegacion y estado via router y data fetching del servidor.

## 10) Manejo de errores y estados de UI

En cada vista:

- estado `loading`
- estado `empty`
- estado `error` con accion de reintento

En login:

- mensaje neutro para credenciales invalidas (sin filtrar si el email existe).
- bloqueo temporal progresivo en intentos fallidos.

## 10.1 Seguridad de autenticacion (obligatoria)

- Hash de password: **Argon2id** con parametros definidos en implementacion.
- Proteccion CSRF en mutaciones (`login/logout`):
  - validacion de `Origin`/`Referer`,
  - token CSRF (double-submit cookie o synchronizer token).
- Mitigacion brute force:
  - rate limit por IP y por email,
  - bloqueo temporal incremental por intentos fallidos,
  - trazabilidad en `admin_audit_logs`.
- Bootstrap de primer admin via proceso seguro fuera de endpoints publicos (script/seed manual controlado).

## 11) Testing strategy

Prioridad E2E:

1. Login valido e invalido.
2. Acceso protegido en rutas admin.
3. Flujo clientes -> detalle -> volver.
4. Conferencistas: busqueda y paginacion.
5. Logout e invalidacion de acceso.

API tests:

- permisos (`401/403`)
- validacion (`400/422`)
- contratos de respuesta (`ok/data`, `ok:false/errorCode/message`)

Pruebas de seguridad:

- `POST login/logout` sin CSRF valido debe fallar.
- sesion expirada devuelve `401`.
- usuario autenticado sin rol admin recibe `403`.
- logout invalida sesion en DB y cookie.

## 12) Criterios de aceptacion (Definition of Done)

- Login admin real contra Neon funcionando.
- Proteccion de `/admin/*` y `/api/admin/*` por sesion + rol.
- Vistas admin del demo integradas en React.
- Datos de clientes/respuestas/conferencistas/matches provenientes de BD real.
- Busqueda y paginacion operativas.
- Pruebas E2E minimas en verde.
- CSRF activo en mutaciones admin y validado por test.
- Rate limiting y bloqueo temporal de login validados.
- Auditoria minima activa (`login_success`, `login_failed`, `logout`, `view_client_detail`, `403_denied`).

## 13) Riesgos y mitigaciones

- Riesgo: acoplar UI a esquema DB crudo.  
  Mitigacion: DTOs y transformacion en capa server.

- Riesgo: fuga de informacion sensible en errores.  
  Mitigacion: contrato de errores uniforme y mensajes sanitizados.

- Riesgo: rendimiento de busquedas con crecimiento de datos.  
  Mitigacion: indices por `email`, `empresa`, y campos de busqueda textual inicial.

## 14) Plan de transicion posterior (no incluido en esta fase)

- Sustituir/ajustar algoritmo de match por scoring real.
- Agregar CRUD parcial de conferencistas.
- Agregar filtros avanzados y exportacion.
- Expandir roles (admin, analyst, operator) si negocio lo requiere.

---

Este documento define la base aprobada con condiciones para pasar a plan detallado de implementacion, manteniendo seguridad real y persistencia real en Neon desde la primera iteracion.
