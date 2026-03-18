const metrics = [
  { num: "01", value: "+15", unit: "años", label: "De experiencia en eventos corporativos" },
  { num: "02", value: "+500", unit: "eventos", label: "Realizados en México y LATAM" },
  { num: "03", value: "+200", unit: "speakers", label: "En catálogo activo" },
  { num: "04", value: "98%", unit: "satisfacción", label: "De nuestros clientes" },
];

export default function WhyUs() {
  return (
    <section className="pt-section pb-section" style={{ background: "#F2EDE4" }}>
      <div className="container-page">

        {/* Label editorial */}
        <p className="font-body text-[10px] tracking-[0.25em] uppercase mb-12" style={{ color: "#999" }}>
          Por qué nosotros
        </p>

        {/* Métricas tipográficas — sin iconos, sin cajas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
          {metrics.map((m) => (
            <div key={m.num} className="flex flex-col">

              {/* Número de orden — micro label */}
              <span
                className="font-body text-[10px] tracking-[0.2em] mb-3"
                style={{ color: "#bbb" }}
              >
                {m.num}
              </span>

              {/* Valor masivo */}
              <span
                className="font-heading font-extrabold text-black leading-none tracking-tighter"
                style={{ fontSize: "clamp(2.5rem, 5vw, 5rem)" }}
              >
                {m.value}
              </span>

              {/* Unidad */}
              <span
                className="font-body text-[11px] tracking-[0.15em] uppercase mt-1 mb-4"
                style={{ color: "#666" }}
              >
                {m.unit}
              </span>

              {/* Línea divisora */}
              <div className="w-8 h-px mb-4" style={{ background: "#000" }} />

              {/* Descripción */}
              <p className="font-body font-light text-sm leading-snug" style={{ color: "#555" }}>
                {m.label}
              </p>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
