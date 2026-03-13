# Spec: Landing Informativa de Campaña — Speakers México

**Fecha:** 2026-03-13
**Proyecto:** Speaker Match (Speakers México)
**Estado:** Aprobado

---

## Contexto

Existen dos productos distintos dentro del mismo proyecto Next.js:

1. **Landing informativa** (`/`) — página de campaña temporal (~meses). Informativa, con personalización para contactos por invitación. CTAs llevan a Speaker Match.
2. **Speaker Match** (`/start`, `/match`, `/gracias`) — herramienta de formulario multi-paso de largo plazo, embeddable en otros sitios.

El IntakeForm actualmente vive en `app/page.tsx`. Este spec mueve el landing a `app/page.tsx` (informativo) y el IntakeForm a `app/start/page.tsx`.

---

## Arquitectura de Rutas

```
app/
├── page.tsx              ← LANDING (campaña, temporal)
│                            Server Component
│                            Lee searchParams.t para personalización
│
├── start/
│   └── page.tsx          ← SPEAKER MATCH — IntakeForm
│                            Antes vivía en /
│                            Recibe ?t=token para precarga de campos
│
├── match/
│   └── page.tsx          ← SPEAKER MATCH — MatchForm (sin cambios)
│
└── gracias/
    └── page.tsx          ← SPEAKER MATCH — Calendly CTA (sin cambios)
```

**Flujo de token:**
`/?t=abc123` → hero personalizado → CTA → `/start?t=abc123` → IntakeForm con campos precargados

---

## Dos Tipos de Tráfico

### Tráfico por invitación (`?t=token` presente)
- `app/page.tsx` lee `searchParams.t`
- Llama `getContactByToken(token)` via Prisma (con fallback null si falla o token inválido)
- Renderiza hero personalizado con nombre y empresa del contacto
- CTA apunta a `/start?t={token}`

### Tráfico orgánico (sin token)
- `app/page.tsx` sin `searchParams.t`
- `getContactByToken` no se llama
- Renderiza hero genérico
- CTA apunta a `/start`

---

## Secciones del Landing (en orden)

### 1. Header
- Logo de Speakers México
- Sin navegación adicional (página de campaña, foco en conversión)

### 2. Hero
**Tráfico por invitación:**
- Título: *"{Nombre}, ya es hora de que tu equipo viva algo diferente 🎤"*
- Subtítulo: *"Preparamos SpeakerMatch® especialmente para {Empresa}. En 5 minutos encontrarás al speaker que dejará huella en tu próximo evento."*

**Tráfico orgánico:**
- Título: *"¿Tu próximo evento merece algo extraordinario? 🎤"*
- Subtítulo: *"Con SpeakerMatch® encontramos al speaker perfecto para tu empresa — el que conecta con tu equipo y mueve resultados reales."*

**Ambos:**
- Tagline: *"Sin costo · Sin compromiso · Propuesta en 24 hrs"*
- CTA primario: *"Quiero encontrar mi speaker →"*

### 3. Logos de clientes ("Empresas que ya lo vivieron")
- Logos en escala de grises: BBVA, Nissan, KPMG, Quálitas, Ingredion
- Reutiliza los assets y lógica existentes de `app/page.tsx`

### 4. Cómo funciona ("Es más fácil de lo que piensas")
3 pasos con numeración:
1. *"Cuéntanos sobre tu evento"* — 5 minutos, nada de formularios eternos
2. *"Recibe tu propuesta personalizada"* — en menos de 24 hrs, opciones que hacen sentido
3. *"Platícamos 15 minutos"* — un consultor te explica, sin presión, sin letra chica

### 5. Muestra de speakers ("El talento que mueve empresas")
- Grid 2×2: 3 cards de speaker + 1 card de contador (+200 speakers)
- Cards: foto placeholder, nombre, especialidad
- Copy del contador: *"+200 speakers esperando conocer tu proyecto"*
- **Nota:** Los speakers son dummy data por ahora. En el futuro vendrán de MySQL via `getMatchSteps()` o endpoint propio.

### 6. Por qué Speakers México ("No somos una agencia más")
- Subtítulo: *"15 años conectando empresas con el talento correcto"*
- 4 métricas en grid 2×2:
  - +15 — *"años haciendo que los eventos importen"*
  - +500 — *"eventos que la gente todavía recuerda"*
  - +200 — *"speakers con quienes trabajamos de cerca"*
  - 98% — *"de clientes que vuelven a buscarnos"*

### 7. Testimonios ("No lo decimos nosotros")
2 quotes con foto, nombre, cargo y empresa:
- *"El speaker que eligieron transformó completamente la energía del evento. Nuestro equipo todavía lo recuerda meses después."*
- *"Pensé que iba a ser un proceso complicado. En 24 horas tenía tres opciones perfectas. No podía creerlo."*
- **Nota:** Testimonios dummy por ahora. El cliente proveerá los reales.

### 8. Garantía ("Lo que nos hace diferentes")
- Fondo negro (#111), texto blanco
- Título: *"Si el speaker no es lo que esperabas, encontramos otro. Sin costo. Sin drama."*
- Subtítulo: *"Confiamos tanto en nuestro proceso que lo respaldamos con nuestra garantía. Así de seguros estamos de lo que hacemos."*
- El contenido se inspira en `components/match/GuaranteePanel.tsx` pero **se crea como componente nuevo** `components/landing/Guarantee.tsx` — `GuaranteePanel` está acoplado al layout sidebar de `/match` (sticky, full-height) y no es reutilizable directamente

### 9. FAQ ("Resolvemos tus dudas")
Acordeón colapsable, 4 preguntas:
1. *"¿Cuánto cuesta usar SpeakerMatch®?"*
2. *"¿Con cuánta anticipación debo contactarlos?"*
3. *"¿Tienen speakers para eventos virtuales?"*
4. *"¿Qué pasa si necesito cancelar?"*
- **Nota:** Respuestas las provee el cliente. El componente se construye con estructura acordeón.

### 10. CTA Final ("No lo dejes para después")
- Título: *"Los mejores speakers ya se están agendando para 2026"*
- Subtítulo: *"5 minutos hoy pueden definir el evento que tu equipo va a recordar por años."*
- CTA: *"Quiero encontrar mi speaker →"* (mismo destino que hero)
- Tagline: *"Sin costo · Sin compromiso · Propuesta en 24 hrs"*

### 11. Footer
- Copyright Speakers México
- Links: Términos · Privacidad

---

## Implementación Técnica

### `app/page.tsx` — Server Component

El proyecto usa **Next.js 16** — `searchParams` es una `Promise` y debe awaitearse.

```tsx
// Lee token desde searchParams (Server Component — sin useSearchParams)
export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const token = t ?? null;
  // findContactByToken viene de lib/contacts.ts (definido en el spec MySQL/Prisma)
  const contact = token ? await findContactByToken(token).catch(() => null) : null;
  // contact es null si token inválido, DB falla, o no hay token

  return (
    <main>
      <LandingHero contact={contact} token={token} />
      <ClientLogos />
      <HowItWorks />
      <SpeakerShowcase />
      <WhyUs />
      <Testimonials />
      <Guarantee />
      <FAQ />
      <FinalCTA token={token} />
      <Footer />
    </main>
  );
}
```

**Importante:** `app/page.tsx` es Server Component puro — lee `searchParams` directamente sin `useSearchParams`. No requiere `<Suspense>` para este propósito.

### `app/start/page.tsx` — IntakeForm movido

```tsx
import { Suspense } from "react";
import IntakeForm from "@/components/intake/IntakeForm";

export default function StartPage() {
  return (
    <main>
      <Suspense fallback={<div className="h-14" />}>
        <IntakeForm />
      </Suspense>
    </main>
  );
}
```

**Token pre-population en `IntakeForm`:** El `IntakeForm` actual **no tiene** lógica de token. Como parte de esta implementación se debe agregar:
1. `useSearchParams()` para leer `?t=` de la URL — requiere `<Suspense>` en el padre (ya incluido arriba)
2. Al montar: si hay token, llamar a `GET /api/contact?t={token}` (definido en spec de personalización)
3. Precargar `formData` con la respuesta: `{ nombre, apellido, empresa, email }`
4. Persistir el token en `speakerMatchStore` via `writeSpeakerMatchData({ token })`
5. Si la llamada falla o el token no existe, el form carga vacío — sin error visible

Los campos precargados son editables — mismo estilo visual que campos vacíos (Opción A aprobada en brainstorming).

### Componentes nuevos a crear

| Componente | Ubicación | Descripción |
|---|---|---|
| `LandingHero` | `components/landing/Hero.tsx` | Hero condicional — recibe `contact` y `token` como props |
| `HowItWorks` | `components/landing/HowItWorks.tsx` | 3 pasos estáticos |
| `SpeakerShowcase` | `components/landing/SpeakerShowcase.tsx` | Grid 2×2 con dummy speakers |
| `WhyUs` | `components/landing/WhyUs.tsx` | 4 métricas en grid |
| `Testimonials` | `components/landing/Testimonials.tsx` | 2 quotes con foto |
| `Guarantee` | `components/landing/Guarantee.tsx` | Sección fondo negro |
| `FAQ` | `components/landing/FAQ.tsx` | Acordeón colapsable (Client Component) |
| `FinalCTA` | `components/landing/FinalCTA.tsx` | CTA de remate |
| `Footer` | `components/landing/Footer.tsx` | Footer simple |

`ClientLogos` no existe como componente standalone — **se extrae de `app/page.tsx` actual** (logos definidos en líneas 5-14 y renderizados en líneas 56-76). Se crea como `components/landing/ClientLogos.tsx` reutilizando la lógica actual incluyendo el Set de logos invertidos.

### Aplicación de Vercel React Best Practices

- **`server-hoist-static-io`** — logos de clientes y datos estáticos hoisted a nivel de módulo
- **`bundle-dynamic-imports`** — `FAQ` (Client Component con estado) se carga con `next/dynamic`
- **`async-parallel`** — si en el futuro se necesitan múltiples fetches en el Server Component, usar `Promise.all()`
- **`rendering-hoist-jsx`** — JSX estático de secciones como HowItWorks y WhyUs fuera de renders
- **`js-set-map-lookups`** — logos invertidos como Set (ya implementado en el código actual)

---

## Datos Dummy vs Futuros

| Sección | Estado actual | Futuro |
|---|---|---|
| Hero personalizado | Token → Prisma/MySQL (con fallback null) | Sin cambio |
| Speakers showcase | Dummy data hardcodeada | MySQL via endpoint propio del backoffice |
| Testimonios | Dummy data — el cliente provee los reales | Hardcodeados o MySQL |
| FAQ respuestas | El cliente provee el contenido | Hardcodeadas |
| Métricas (15 años, etc.) | Hardcodeadas | Hardcodeadas (no cambian frecuentemente) |

---

## Criterios de Aceptación

**Rutas:**
- `/` carga el landing informativo (no el IntakeForm)
- `/start` carga el IntakeForm (ruta movida desde `/`)
- `/start?t={token}` precarga los campos del IntakeForm con datos del contacto
- `/match` y `/gracias` funcionan sin cambios

**Hero personalizado:**
- Dado `/?t=token-válido`, el hero muestra el nombre y empresa del contacto
- Dado `/?t=token-inválido`, el hero muestra la versión orgánica (fallback silencioso)
- Dado `/` sin token, el hero muestra la versión orgánica

**CTA:**
- El CTA del hero con token apunta a `/start?t={token}`
- El CTA del hero sin token apunta a `/start`
- El CTA del footer (FinalCTA) sigue el mismo patrón

**Secciones:**
- Las 9 secciones de contenido se renderizan en el orden definido: Hero → Logos → Cómo funciona → Speakers → Por qué nosotros → Testimonios → Garantía → FAQ → CTA final (Header y Footer no cuentan como secciones de contenido)
- FAQ es interactivo (acordeón abre/cierra) — Client Component
- El landing es responsive (mobile-first)

**Performance:**
- `app/page.tsx` no tiene lógica cliente — es Server Component puro
- FAQ se carga con `next/dynamic` para no bloquear el bundle inicial

---

## Fuera de Alcance

- Contenido real de testimonios y FAQ (lo provee el cliente)
- Fotos reales de speakers (se usan placeholders)
- Animaciones entre secciones (se pueden añadir en iteración posterior)
- Analytics / tracking de secciones (fuera del alcance de esta campaña)
- Internacionalización (solo español)
