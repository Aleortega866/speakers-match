# Spec Maestro — Speaker Match · Speakers México

**Fecha:** 2026-03-13
**Estado:** Aprobado
**Para:** 1-2 desarrolladores

---

## Visión General

Este documento consolida los tres specs aprobados del proyecto en un plan de trabajo único con estimaciones de tiempo. No duplica el detalle técnico — referencia los specs individuales.

**Specs de referencia:**
- `2026-03-12-personalized-landing-zapier-design.md` — Personalización por token + flujos Zapier
- `2026-03-13-mysql-prisma-unified-architecture-design.md` — Data layer (actualizado: PostgreSQL/Neon)
- `2026-03-13-landing-campaign-design.md` — Landing informativa + reorganización de rutas

---

## Stack Definitivo

| Capa | Tecnología |
|---|---|
| Frontend + API | Next.js 16, App Router, Vercel |
| Base de datos | **Neon (PostgreSQL)** |
| ORM | Prisma (`provider = "postgresql"`) |
| Automatización emails | Zapier (conector PostgreSQL) |
| Agendado | Calendly |
| Env local | XAMPP (solo desarrollo, sin conexión a Neon local) |

> **Cambio vs specs anteriores:** Los specs de referencia mencionan MySQL (Railway/PlanetScale). El proveedor correcto es **Neon (PostgreSQL)**. El schema de Prisma usa `provider = "postgresql"` y `DATABASE_URL` tiene formato `postgresql://...`. El conector de Zapier es **PostgreSQL** en lugar de MySQL. Toda la lógica de app y los flujos Zapier son idénticos.

---

## Arquitectura de Rutas (Estado Final)

```
/                    ← Landing informativa (campaña temporal)
/start               ← Speaker Match — IntakeForm (movido desde /)
/start?t={token}     ← Speaker Match — IntakeForm con precarga de datos
/match               ← Speaker Match — MatchForm (sin cambios)
/gracias             ← Speaker Match — Calendly CTA
/api/contact         ← GET: busca contacto por token en Neon
/api/event           ← POST: registra eventos + llama webhooks Zapier
/api/match/steps     ← (futuro backoffice) CRUD de preguntas
/admin               ← (spec separado) Backoffice
```

---

## Fases de Desarrollo

### Fase 0 — Infraestructura Base
**Tipo:** Backend · **Estimación:** 1 día · **Bloquea:** Todo

#### Tareas

| # | Tarea | Estimación |
|---|---|---|
| 0.1 | Crear proyecto en Neon, obtener `DATABASE_URL` | 30 min |
| 0.2 | Actualizar `prisma/schema.prisma` a `provider = "postgresql"` con tablas `Contact`, `MatchStep`, `MatchStepOption` | 1 h |
| 0.3 | Ejecutar `npx prisma migrate dev` — crear tablas en Neon | 30 min |
| 0.4 | Crear `prisma/seed.ts` y ejecutar `npx prisma db seed` — cargar 5 pasos del match | 1 h |
| 0.5 | Crear `lib/prisma.ts` (singleton), `lib/contacts.ts`, `lib/matchSteps.ts` | 1.5 h |
| 0.6 | Configurar variables de entorno en Vercel: `DATABASE_URL`, `ZAPIER_WEBHOOK_FORM_STARTED`, `ZAPIER_WEBHOOK_FORM_COMPLETED`, `ZAPIER_WEBHOOK_OUTREACH`, `NEXT_PUBLIC_CALENDLY_URL` | 30 min |

**Total Fase 0: ~5 h (~1 día)**

---

### Fase 1 — API Routes
**Tipo:** Backend · **Estimación:** 1.5 días · **Depende de:** Fase 0

#### Tareas

| # | Tarea | Estimación |
|---|---|---|
| 1.1 | `GET /api/contact?t={token}` — consulta Neon via `findContactByToken()`, devuelve datos o 404 | 1.5 h |
| 1.2 | `POST /api/event` — same-origin check, escribe en Neon via `upsertContactEvent()`, llama webhook Zapier fire-and-forget. Para `form_completed`: parsear `data.matchAnswers` y pasarlo como `match_answers` a `upsertContactEvent()` | 2 h |
| 1.3 | `middleware.ts` — rate limiting 30 req/min por IP en `/api/contact` | 1 h |
| 1.4 | Pruebas manuales de ambas rutas con datos dummy (curl / Postman) | 1 h |

**Total Fase 1: ~5.5 h (~1.5 días)**

---

### Fase 2 — Speaker Match (Reorganización + Mejoras)
**Tipo:** Frontend · **Estimación:** 1 día · **Depende de:** Fase 1 · **Paralela con:** Fase 3

#### Tareas

| # | Tarea | Estimación |
|---|---|---|
| 2.1 | Crear `app/start/page.tsx` — mover IntakeForm de `/` a `/start` con `<Suspense>` | 30 min |
| 2.2 | Agregar `useSearchParams` en `IntakeForm` para leer `?t=token`, llamar `GET /api/contact`, precargar campos | 2 h |
| 2.3 | Extender `speakerMatchStore` — agregar campo `token?: string` en tipo, `readSpeakerMatchData`, `writeSpeakerMatchData`, `getDefaultData` | 1 h |
| 2.4 | `app/match/page.tsx` → async Server Component, llama `getMatchSteps()`, pasa `steps` como props a `MatchForm` | 1 h |
| 2.5 | `MatchForm.tsx` → refactorizar para recibir `steps` como prop, reemplazar 4 referencias a `matchSteps` importado | 45 min |
| 2.6 | `app/gracias/page.tsx` → CTA Calendly real con prefill de nombre+email, enviar evento `form_completed` con `matchAnswers` al montar | 1.5 h |

**Total Fase 2: ~7 h (~1 día)**

---

### Fase 3 — Landing Informativa
**Tipo:** Frontend · **Estimación:** 3 días · **Depende de:** Fase 0 (hero) · **Paralela con:** Fase 2

#### Tareas

| # | Tarea | Estimación |
|---|---|---|
| 3.1 | `app/page.tsx` → Server Component, lee `searchParams.t`, llama `findContactByToken()`, pasa `contact` a `LandingHero` | 1 h |
| 3.2 | `components/landing/Hero.tsx` — recibe props `contact` y `token` (ambos separados). Hero condicional: saludo personalizado (invitado) vs genérico (orgánico). CTA apunta a `/start?t={token}` si hay token, a `/start` si no | 2 h |
| 3.2b | Header inline en `app/page.tsx` — logo de Speakers México, sin navegación (campaña de conversión) | 20 min |
| 3.3 | `components/landing/ClientLogos.tsx` — extraer de `app/page.tsx` actual | 30 min |
| 3.4 | `components/landing/HowItWorks.tsx` — 3 pasos estáticos | 1 h |
| 3.5 | `components/landing/SpeakerShowcase.tsx` — grid 2×2 con dummy speakers + contador | 1.5 h |
| 3.6 | `components/landing/WhyUs.tsx` — 4 métricas en grid | 1 h |
| 3.7 | `components/landing/Testimonials.tsx` — 2 quotes con foto placeholder | 1 h |
| 3.8 | `components/landing/Guarantee.tsx` — sección fondo negro, nuevo componente (no reutiliza GuaranteePanel) | 1 h |
| 3.9 | `components/landing/FAQ.tsx` — Client Component con acordeón colapsable, 4 preguntas. Cargado con `next/dynamic` en `app/page.tsx` para no bloquear el bundle inicial | 2 h |
| 3.10 | `components/landing/FinalCTA.tsx` — CTA de remate con urgencia | 45 min |
| 3.11 | `components/landing/Footer.tsx` — footer simple | 30 min |
| 3.12 | Responsive mobile-first en todos los componentes landing | 2 h |
| 3.13 | Animaciones de entrada (fade-slide-in) consistentes con el resto del proyecto | 1 h |

**Total Fase 3: ~16 h (~2.5-3 días)**

---

### Fase 4 — Zapier + Calendly
**Tipo:** No-code · **Estimación:** 1 día · **Depende de:** Fases 1 y 2

> **Importante:** Todos los Zaps que interactúan con Neon usan el **conector PostgreSQL de Zapier** (no MySQL). Neon expone una conexión PostgreSQL estándar.

#### Tareas

| # | Tarea | Estimación |
|---|---|---|
| 4.1 | Verificar acceso externo a Neon desde Zapier — confirmar que Neon permite conexiones desde IPs de Zapier (Neon es público por defecto, pero verificar SSL/TLS requerido) | 30 min |
| 4.2 | **Zap 1** — Nuevo contacto outreach: webhook (`ZAPIER_WEBHOOK_OUTREACH`) → genera token → INSERT/UPDATE en Neon (PostgreSQL) → email con link personalizado `/?t={token}` | 1.5 h |
| 4.3 | **Zap 2** — form_started: webhook (`ZAPIER_WEBHOOK_FORM_STARTED`) → busca por token/email en Neon (PostgreSQL) → UPDATE `form_started_at` (INSERT si contacto orgánico nuevo) | 1 h |
| 4.4 | **Zap 3** — form_completed: webhook (`ZAPIER_WEBHOOK_FORM_COMPLETED`) → UPDATE Neon (PostgreSQL) → delay 30 min → re-lee fila → si `calendly_booked_at` vacío → email "agenda tu llamada" | 1.5 h |
| 4.5 | **Zap 4** — Calendly booked: evento Calendly → busca por email en Neon (PostgreSQL) → UPDATE `calendly_booked_at` | 1 h |
| 4.6 | **Zap 5** — Abandono: schedule 2x/día → SELECT en Neon (PostgreSQL) donde `form_started_at IS NOT NULL AND form_completed_at IS NULL AND form_started_at < NOW() - INTERVAL '2 hours' AND correo_abandono_enviado = false` → email → UPDATE flag | 1.5 h |
| 4.7 | Configurar Calendly: crear evento 15 min, activar webhook hacia Zapier (Zap 4), probar prefill URL con nombre+email | 30 min |
| 4.8 | Prueba end-to-end del flujo completo con contacto real | 1 h |

**Total Fase 4: ~8.5 h (~1 día)**

---

### Fase 5 — QA y Deploy
**Tipo:** Full · **Estimación:** 0.5 día · **Depende de:** Todas las fases

#### Tareas

| # | Tarea | Estimación |
|---|---|---|
| 5.1 | Prueba flujo invitado: `/?t=token` → landing personalizado → `/start?t=token` → form precargado → match → gracias → Calendly | 1 h |
| 5.2 | Prueba flujo orgánico: `/` → landing genérico → `/start` → form vacío → match → gracias → Calendly | 30 min |
| 5.3 | Prueba abandono: iniciar form, esperar 2h (o forzar en Zapier), verificar email | 30 min |
| 5.4 | Verificar panel de leads en Neon (filas correctamente escritas) | 30 min |
| 5.5 | Deploy final en Vercel con variables de producción, smoke test | 30 min |

**Total Fase 5: ~3.5 h (~0.5 día)**

---

## Resumen de Estimaciones

| Fase | Tipo | Estimación | Puede parallelizarse |
|---|---|---|---|
| 0 — Infraestructura | Backend | 1 día | No — bloquea todo |
| 1 — API Routes | Backend | 1.5 días | No — depende de Fase 0 |
| 2 — Speaker Match | Frontend | 1 día | Sí — con Fase 3 |
| 3 — Landing | Frontend | 3 días | Sí — con Fase 2. Secciones estáticas sin BD; hero personalizado depende de Fase 0 |
| 4 — Zapier + Calendly | No-code | 1 día | No — depende de 1 y 2 |
| 5 — QA + Deploy | Full | 0.5 días | No — última fase |

### Con 1 desarrollador (secuencial)
```
Fase 0 → Fase 1 → Fase 2 → Fase 3 → Fase 4 → Fase 5
  1d        1.5d      1d       3d        1d       0.5d
                                                        = ~8 días
```

### Con 2 desarrolladores (paralelo óptimo)
```
Dev A: Fase 0 → Fase 1 → Fase 2 → Fase 4 → Fase 5
Dev B:                   Fase 3  →
         1d      1.5d     1d/3d     1d      0.5d  = ~5-6 días
```

---

## Dependencias Críticas

```
Neon (Fase 0)
    ↓
API Routes (Fase 1)
    ↓              ↘
Speaker Match     Landing Hero personalizado
(Fase 2)          (Fase 3 — parcial sin token)
    ↓
Zapier + Calendly (Fase 4)
    ↓
QA + Deploy (Fase 5)
```

> **Nota:** La Fase 3 puede iniciar sin la Fase 1 — las secciones estáticas (HowItWorks, WhyUs, Testimonials, etc.) no dependen de la BD. Solo el hero personalizado requiere que `findContactByToken()` y la Fase 0 estén listos.

---

## Fuera de Alcance (Backlog)

Estas funcionalidades fueron identificadas durante el diseño pero quedan para una fase posterior:

| Item | Razón de exclusión |
|---|---|
| Backoffice `/admin` | Spec propio pendiente |
| Speakers reales en landing | El cliente provee fotos y datos |
| Testimonios reales | El cliente provee el contenido |
| Respuestas FAQ | El cliente provee el contenido |
| Panel de leads custom | Neon directamente cubre esta necesidad |
| Widget Calendly embebido | Se usa link directo en primera iteración |
| Autenticación backoffice | Parte del spec de backoffice |
| A/B testing de copy | Fuera del alcance de la campaña |
