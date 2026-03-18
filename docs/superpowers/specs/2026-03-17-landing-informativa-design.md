# Spec: Landing Informativa — Sprint 3

**Fecha**: 2026-03-17
**Estado**: Aprobado
**Basado en**: master-spec-estimaciones, landing-campaign-design, sesión de brainstorming visual

---

## Objetivo

Reemplazar `app/page.tsx` (actualmente muestra el `IntakeForm`) por una landing informativa de campaña con 10 secciones. La landing es un Server Component que personaliza el hero cuando recibe `?t={token}` en la URL.

---

## Arquitectura

### Árbol de componentes

```
app/page.tsx                         (async Server Component)
├── Hero.tsx                         (Server Component)
├── ClientLogos.tsx                  (Server Component)
├── HowItWorks.tsx                   (Server Component)
├── SpeakerShowcase.tsx              (Server Component)
├── WhyUs.tsx                        (Server Component)
├── Testimonials.tsx                 (Server Component)
├── Guarantee.tsx                    (Server Component)
├── FAQ.tsx                          (Client Component — cargado con next/dynamic, ssr:false)
├── FinalCTA.tsx                     (Server Component)
└── Footer.tsx                       (Server Component)
```

### Flujo de datos en `app/page.tsx`

```typescript
// Next.js 16: searchParams es una Promise — se debe awaitear
const { t } = await searchParams;
const contact = t ? await findContactByToken(t).catch(() => null) : null;
```

- `contact` y `token` se pasan como props a `Hero` y `FinalCTA`.
- Si no hay token o el lookup falla: `contact = null`, hero muestra versión genérica.
- Todos los demás componentes son estáticos — no necesitan props del Server.

### Directorio de componentes

Todos los componentes nuevos van en `components/landing/`.

---

## Ritmo visual de secciones

| Sección | Fondo | Texto |
|---------|-------|-------|
| Hero | `#ffffff` | Negro |
| ClientLogos | `#ffffff` | Negro/gris |
| HowItWorks | `#f5f5f5` | Negro |
| SpeakerShowcase | `#ffffff` | Negro |
| WhyUs | `#f5f5f5` | Negro |
| Testimonials | `#ffffff` | Negro |
| Guarantee | `#111111` | Blanco |
| FAQ | `#ffffff` | Negro |
| FinalCTA | `#000000` | Blanco |
| Footer | `#f5f5f5` | Gris |

---

## Secciones — detalle

### Hero

**Archivo**: `components/landing/Hero.tsx`
**Props**: `contact: Pick<ContactData, "nombre" | "empresa"> | null`, `token: string | null`

En `app/page.tsx`, pasar el contacto con narrowing explícito:
```typescript
contact={contact ? { nombre: contact.nombre, empresa: contact.empresa } : null}
```

**Versión genérica** (`contact === null`):
- Headline: `"El speaker correcto transforma un evento"`
- Subtítulo: `"Matching personalizado con los mejores speakers de México para tu evento corporativo"`
- Tagline: `"Sin costo · Sin compromiso · Propuesta en 24 hrs"`
- CTA: `<Link href="/start">Encuentra un speaker</Link>`

**Versión personalizada** (`contact !== null`):
- Headline: `"Hola [nombre], encontremos el speaker ideal para [empresa]"`
- Mismo subtítulo y tagline
- CTA: `<Link href={`/start?t=${token}`}>Encuentra un speaker</Link>`

Animaciones: headline con `animate-fade-slide-in`, subtítulo con `animationDelay: "120ms"`, CTA con `animationDelay: "240ms"`.

---

### ClientLogos

**Archivo**: `components/landing/ClientLogos.tsx`
El array `logos` y el `Set INVERTED_LOGOS` se definen como constantes de módulo dentro de `components/landing/ClientLogos.tsx`. `app/start/page.tsx` mantiene su propia copia — no se refactoriza en este sprint.

---

### HowItWorks

**Archivo**: `components/landing/HowItWorks.tsx`
Tres pasos numerados, completamente estáticos:

1. **Completa el match** — 5 preguntas sobre tu evento y audiencia
2. **Recibe tu propuesta** — En menos de 24 horas con speakers alineados a tus objetivos
3. **Agenda tu llamada** — Confirma al speaker y cierra los detalles con nuestro equipo

Layout: números grandes en negro (`01`, `02`, `03`) con título y descripción a la derecha. Fila horizontal en desktop, columna en mobile.

---

### SpeakerShowcase

**Archivo**: `components/landing/SpeakerShowcase.tsx`
Grid 2×2 con datos dummy hardcodeados. Usa `next/image` con placeholder.

**3 speaker cards** (estilo A — foto + datos):
- Foto placeholder con `next/image src="/placeholder-speaker.png"` (archivo 400×400 gris a crear en `public/`). Si la imagen no existe aún, usar `<div>` con fondo gris como fallback temporal.
- Nombre, tema, stat de conferencias, badge "Disponible"

| Nombre | Tema | Stat |
|--------|------|------|
| Alejandro Meza | Liderazgo · Innovación | +80 conferencias |
| Sofía Ramírez | Motivación · Bienestar | +120 conferencias |
| Carlos Ibáñez | Ventas · Alta Dirección | +200 conferencias |

**1 card contadora** (fondo negro):
- `+200` en tipografía masiva blanca
- Subtítulo: `"speakers en nuestro catálogo"`

Grid: `grid-cols-2` en desktop, `grid-cols-1` en mobile. La card contadora ocupa la 4ª celda (fila 2, columna 2) — sin spanning.

---

### WhyUs

**Archivo**: `components/landing/WhyUs.tsx`
4 métricas en grid 2×2, completamente estáticas:

| Métrica | Descripción |
|---------|-------------|
| `+15 años` | De experiencia en eventos corporativos |
| `+500 eventos` | Realizados en México y LATAM |
| `+200 speakers` | En catálogo activo |
| `98%` | De satisfacción de clientes |

Cada métrica: número grande en `font-heading font-extrabold`, descripción en `font-body font-light`.

---

### Testimonials

**Archivo**: `components/landing/Testimonials.tsx`
2 cards lado a lado (en desktop), apiladas en mobile. Datos dummy.

**Testimonial 1:**
- Cita: *"El matching fue sorprendentemente preciso. El speaker conectó perfecto con nuestra cultura."*
- Nombre: Ana González
- Cargo: Directora de RH, BBVA

**Testimonial 2:**
- Cita: *"En 24 horas teníamos una propuesta con 3 opciones. Contratamos en la misma semana."*
- Nombre: Ricardo Mora
- Cargo: CEO, Grupo Ingredion

Foto: `next/image src="/placeholder-speaker.png"` (mismo archivo usado en SpeakerShowcase), circular con `rounded-full`.

---

### Guarantee

**Archivo**: `components/landing/Guarantee.tsx`
Sección fondo `#111`, texto blanco. **Componente nuevo** — NO reutiliza `GuaranteePanel` (está acoplado al layout sidebar de `/match`).

- Texto principal: `"Si no encontramos al speaker adecuado para tu evento, te decimos por qué — sin rodeos y sin cobrarte nada."`
- Tagline: `"Así de simple es nuestra garantía."`
- Centrado, tipografía grande.

---

### FAQ

**Archivo**: `components/landing/FAQ.tsx`
`"use client"`. Cargado en `app/page.tsx` con `next/dynamic(() => import(...), { ssr: false })`.

Estado: `openIndex: number | null` — solo una pregunta abierta a la vez (toggle: si se clickea la abierta, se cierra).

**Estilo acordeón A** — líneas simples con +/−:
- Separadores `border-b border-gray-200`
- Signo `+` / `−` alineado a la derecha
- Transición de altura usando el truco CSS grid: el wrapper de la respuesta usa `grid grid-rows-[0fr]` → `grid-rows-[1fr]` con `transition-[grid-template-rows] duration-300`, y el contenido interior lleva `overflow-hidden`

**4 preguntas:**

1. ¿Cuánto cuesta el servicio de matching?
   *El matching es completamente sin costo. Solo pagas si decides contratar al speaker que te recomendamos.*

2. ¿En cuánto tiempo recibo la propuesta?
   *En menos de 24 horas hábiles. Nuestro equipo revisa tu perfil de evento y selecciona manualmente las mejores opciones.*

3. ¿Pueden conseguir speakers internacionales?
   *Sí. Tenemos acceso a speakers de toda LATAM, España y algunos de habla inglesa con experiencia en audiencias mexicanas.*

4. ¿Qué pasa si el speaker cancela el evento?
   *Gestionamos un reemplazo de igual o mayor nivel sin costo adicional. La continuidad de tu evento es nuestra responsabilidad.*

---

### FinalCTA

**Archivo**: `components/landing/FinalCTA.tsx`
**Props**: `token: string | null`

- Fondo negro
- Headline: `"Las agendas de los mejores speakers ya se están llenando"`
- Subtítulo: `"Empieza hoy — tu propuesta llega en menos de 24 horas"`
- CTA: `href={token ? `/start?t=${token}` : "/start"}` con texto `"Encuentra tu speaker"`

---

### Footer

**Archivo**: `components/landing/Footer.tsx`
- Fondo `#f5f5f5`
- Copyright: `© 2026 Speakers México`
- Links: `<a href="#">Términos y Condiciones</a>` · `<a href="#">Política de Privacidad</a>` (placeholders hasta que existan las páginas legales)

---

## Reorganización de `app/page.tsx`

`app/page.tsx` actual renderiza `IntakeForm` (que ahora vive en `/start`). Se reemplaza completo:

```typescript
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const contact = t ? await findContactByToken(t).catch(() => null) : null;

  return (
    <main>
      <Hero contact={contact} token={t ?? null} />
      <ClientLogos />
      <HowItWorks />
      <SpeakerShowcase />
      <WhyUs />
      <Testimonials />
      <Guarantee />
      <FAQ /> {/* cargado con next/dynamic */}
      <FinalCTA token={t ?? null} />
      <Footer />
    </main>
  );
}
```

**Acceptance criteria de la ruta `/`:**
- No tiene `"use client"`
- No renderiza `IntakeForm`
- `/?t=TOKEN_VALIDO` → hero personalizado con nombre y empresa
- `/?t=INVALIDO` → hero genérico (fallback silencioso)
- `/start` sigue funcionando exactamente igual

---

## Animaciones

En este sprint, **solo el Hero** aplica `animate-fade-slide-in` con `animationDelay` escalonado al cargar la página. El resto de las secciones se renderizan sin animación de entrada.

Task 3.12 (al finalizar todos los componentes): pasar `frontend-ui-animator` para agregar animaciones de scroll consistentes en todas las secciones. Todas deben respetar `prefers-reduced-motion`.

---

## Lo que NO cambia

- `app/start/page.tsx` — sin cambios
- `app/match/page.tsx` — sin cambios
- `app/gracias/page.tsx` — sin cambios
- `lib/contacts.ts`, `lib/matchSteps.ts`, `lib/prisma.ts` — sin cambios
- Todos los estilos de `globals.css` — sin cambios

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|-----------|
| Next.js 16: `searchParams` es Promise | Usar `await searchParams` explícito en `app/page.tsx` |
| `findContactByToken` puede lanzar | Siempre wrappear con `.catch(() => null)` |
| `next/dynamic` con `ssr:false` en FAQ | Solo afecta FAQ — resto de la página es SSR puro |
| Fotos placeholder de speakers | Usar `next/image` con `src` de placeholder gris local o color sólido como background |
