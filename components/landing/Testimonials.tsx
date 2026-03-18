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
    <section className="bg-white pt-section pb-section">
      <div className="container-page">

        <h2 className="text-display font-heading font-extrabold text-black leading-none mb-12 text-center">
          Lo que dicen nuestros clientes
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="border border-gray-200 p-8 flex flex-col gap-6"
            >
              <p className="font-body font-light text-gray-700 leading-relaxed text-base italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-4">
                {/* Avatar placeholder */}
                <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
                <div>
                  <p className="font-body font-semibold text-black text-sm">
                    {t.name}
                  </p>
                  <p className="font-body text-xs text-gray-400">
                    {t.role} · {t.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
