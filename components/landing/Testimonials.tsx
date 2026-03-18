import TestimonialsAnimator from "@/components/ui/TestimonialsAnimator";

const testimonials = [
  {
    quote:
      "El matching fue sorprendentemente preciso. El speaker conectó perfecto con nuestra cultura y el equipo salió transformado.",
    name: "Ana González",
    role: "Directora de RH",
    company: "BBVA",
  },
  {
    quote:
      "En 24 horas teníamos una propuesta con 3 opciones. Contratamos en la misma semana. Proceso impecable.",
    name: "Ricardo Mora",
    role: "CEO",
    company: "Grupo Ingredion",
  },
];

export default function Testimonials() {
  return (
    <section className="testimonials-section bg-white pt-section pb-section">
      <div className="container-page">

        <p className="t-label font-body text-[10px] tracking-[0.25em] uppercase mb-16" style={{ color: "#bbb" }}>
          Clientes
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-8">
          {testimonials.map((t, i) => (
            <div key={t.name} className={`t-card-${i} flex flex-col`}>

              {/* Comilla gigante */}
              <span
                className="t-quote-mark font-heading font-extrabold text-black leading-none select-none mb-4"
                style={{ fontSize: "clamp(4rem, 8vw, 8rem)", opacity: 0.08 }}
                aria-hidden
              >
                "
              </span>

              {/* Cita */}
              <blockquote
                className="font-body font-light text-black leading-relaxed -mt-8 md:-mt-10"
                style={{ fontSize: "clamp(1rem, 1.5vw, 1.25rem)" }}
              >
                {t.quote}
              </blockquote>

              {/* Línea + atribución */}
              <div className="flex items-center gap-4 mt-8">
                <div
                  className="t-line w-8 h-px flex-shrink-0"
                  style={{ background: "#000" }}
                />
                <div className="t-attribution">
                  <p className="font-body font-semibold text-black text-sm">
                    {t.name}
                  </p>
                  <p className="font-body text-[11px] tracking-wide uppercase mt-0.5" style={{ color: "#999" }}>
                    {t.role} · {t.company}
                  </p>
                </div>
              </div>

              {/* Número editorial */}
              <p className="t-num font-body text-[10px] tracking-[0.2em] mt-8" style={{ color: "#ddd" }}>
                0{i + 1}
              </p>

            </div>
          ))}
        </div>

      </div>

      <TestimonialsAnimator />
    </section>
  );
}
