# Jira Tickets — Miguel (Frontend)

**Fecha:** 2026-03-24
**Proyecto:** Speakers Match
**Rol:** Frontend Developer
**Total estimado:** 54.5 hrs

---

## Distribución del equipo


| Desarrollador     | Hrs         |
| ----------------- | ----------- |
| Daniel (Backend)  | 50.5        |
| Miguel (Frontend) | 54.5        |
| **Total**         | **105 hrs** |


---

## SM-01 — Análisis técnico (Git, orquestación)

**Tipo:** Task
**Asignado:** Miguel
**Estimación:** 2.5 hrs
**Épica:** Setup & Coordinación
**Sprint:** Sprint 1
**Prioridad:** Alta

**Descripción:**
Análisis inicial del repositorio, revisión de ramas y acuerdos de flujo de trabajo Git con Daniel. Orquestación de dependencias entre módulos frontend/backend.

**Criterios de aceptación:**

- Branching strategy acordada con Daniel (naming, PRs, merges)
- Dependencias frontend → backend identificadas por módulo
- `.env.local` configurado y conexión a Neon verificada
- Convenciones de commits acordadas

---

## SM-02 — Landing Page: Desarrollo Frontend

**Tipo:** Story
**Asignado:** Miguel
**Estimación:** 16 hrs · 2 días
**Épica:** Landing Page
**Sprint:** Sprint 1
**Prioridad:** Alta
**Bloqueado por:** Backend Landing (Daniel) · Infra API/Neon (Daniel)

**Descripción:**
Desarrollo completo del frontend de la Landing Page informativa en `/`. Incluye componentes React, diseño visual, animaciones y navegación hacia el flujo SpeakerMatch.

**Criterios de aceptación:**

- Ruta `/` renderiza la landing informativa
- Secciones: Hero, propuesta de valor, CTA hacia `/start`
- Animaciones scroll-reveal implementadas
- Responsive: mobile, tablet, desktop
- Sin errores de consola en build de producción

---

## SM-03 — Landing Page: Conexión servicios (API interna + Zapier)

**Tipo:** Task
**Asignado:** Miguel
**Estimación:** 8 hrs · 1 día
**Épica:** Landing Page
**Sprint:** Sprint 1
**Prioridad:** Media
**Bloqueado por:** Infra API/Neon (Daniel)

**Descripción:**
Integrar el frontend de la Landing con `/api/event` y webhooks Zapier para registrar eventos de visita y conversión.

**Criterios de aceptación:**

- Evento `form_started` disparado al navegar a `/start` desde la landing
- Llamadas a `/api/event` correctamente tipadas (TypeScript)
- Errores de red manejados sin romper la UI (fire-and-forget)
- Webhooks Zapier verificados en staging con logs

---

## SM-04A — Backoffice: Desarrollo Frontend

**Tipo:** Story
**Asignado:** Miguel
**Estimación:** 10 hrs · 2 días
**Épica:** Backoffice (Admin)
**Sprint:** Sprint 2
**Prioridad:** Alta
**Bloqueado por:** Backend Backoffice (Daniel — 15 hrs)

**Descripción:**
Desarrollo del panel de administración bajo `app/(admin)`. Incluye login, dashboard, listados de clientes y conferencistas. Diseño basado en `docs/test.html`. Spec: `2026-03-23-admin-backoffice-neon-design.md`.

**Criterios de aceptación:**

- `/admin/login` — formulario de login funcional
- `/admin` — dashboard con métricas básicas
- `/admin/clientes` — listado con búsqueda y paginación
- `/admin/clientes/[id]` — detalle con respuestas del cuestionario
- `/admin/conferencistas` — listado con búsqueda y paginación
- Rutas protegidas: redirige a `/admin/login` sin sesión activa
- Diseño fiel al demo `docs/test.html`

---

## SM-04B — Backoffice: Conexión servicios (API interna)

**Tipo:** Task
**Asignado:** Miguel
**Estimación:** 4 hrs
**Épica:** Backoffice (Admin)
**Sprint:** Sprint 2
**Prioridad:** Media
**Bloqueado por:** Backend Backoffice (Daniel) · SM-04A

**Descripción:**
Conectar los componentes del Backoffice con los endpoints `/api/admin/`*. Datos reales de Neon en listados y vistas de detalle.

**Criterios de aceptación:**

- Listado clientes consume `/api/admin/clientes` con paginación real
- Listado conferencistas consume `/api/admin/conferencistas`
- Búsqueda conectada al backend (no filtrado en cliente)
- Cookie de sesión enviada correctamente en cada request
- Estados de carga y error manejados en UI

---

## SM-05 — SpeakerMatch (Frontoffice): Desarrollo Frontend

**Tipo:** Story
**Asignado:** Miguel
**Estimación:** 10 hrs · 2 días
**Épica:** SpeakerMatch Frontoffice
**Sprint:** Sprint 1
**Prioridad:** Alta
**Bloqueado por:** Backend SpeakerMatch (Daniel — 8 hrs)

**Descripción:**
Desarrollo del flujo SpeakerMatch: IntakeForm (`/start`, `/start?t={token}`) con precarga por token, MatchForm multi-paso (`/match`) y pantalla de cierre con Calendly (`/gracias`).

**Criterios de aceptación:**

- `/start` renderiza IntakeForm correctamente
- `/start?t={token}` precarga datos via `/api/contact?t={token}`
- `/match` muestra pasos dinámicos desde la BD
- `/gracias` muestra CTA con embed/link a Calendly
- Flujo completo navegable sin errores
- Responsive mobile y desktop

---

## SM-06 — SpeakerMatch (Frontoffice): Conexión servicios (API interna + Zapier)

**Tipo:** Task
**Asignado:** Miguel
**Estimación:** 4 hrs
**Épica:** SpeakerMatch Frontoffice
**Sprint:** Sprint 1
**Prioridad:** Media
**Bloqueado por:** Backend SpeakerMatch (Daniel) · SM-05

**Descripción:**
Integrar el frontend del SpeakerMatch con `/api/event` y Zapier. Registrar eventos `form_started` y `form_completed` con las respuestas del cuestionario.

**Criterios de aceptación:**

- `form_started` disparado al iniciar el IntakeForm
- `form_completed` disparado al terminar MatchForm con `matchAnswers` completo
- Payload a `/api/event` tipado correctamente (TypeScript)
- Webhooks Zapier verificados en staging
- Fallo del webhook no bloquea la navegación del usuario

---

## Resumen


| ID     | Ticket                            | Sprint | Hrs          | Bloqueado por |
| ------ | --------------------------------- | ------ | ------------ | ------------- |
| SM-01  | Análisis técnico                  | 1      | 2.5          | —             |
| SM-02  | Landing Page — Frontend           | 1      | 16           | Daniel (BE)   |
| SM-03  | Landing Page — Conexión servicios | 1      | 8            | Daniel (BE)   |
| SM-04A | Backoffice — Frontend             | 2      | 10           | Daniel (BE)   |
| SM-04B | Backoffice — Conexión servicios   | 2      | 4            | Daniel (BE)   |
| SM-05  | SpeakerMatch — Frontend           | 1      | 10           | Daniel (BE)   |
| SM-06  | SpeakerMatch — Conexión servicios | 1      | 4            | Daniel (BE)   |
|        | **Total**                         |        | **54.5 hrs** |               |


