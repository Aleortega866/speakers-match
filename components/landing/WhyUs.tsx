const metrics = [
  { value: "+15 años", label: "De experiencia en eventos corporativos" },
  { value: "+500 eventos", label: "Realizados en México y LATAM" },
  { value: "+200 speakers", label: "En catálogo activo" },
  { value: "98%", label: "De satisfacción de clientes" },
];

export default function WhyUs() {
  return (
    <section className="bg-[#f5f5f5] pt-section pb-section">
      <div className="container-page">

        <h2 className="text-display font-heading font-extrabold text-black leading-none mb-12 text-center">
          Por qué nosotros
        </h2>

        <div className="grid grid-cols-2 gap-8 md:gap-12 max-w-3xl mx-auto">
          {metrics.map((m) => (
            <div key={m.value} className="flex flex-col">
              <span className="font-heading font-extrabold text-black leading-none mb-2" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}>
                {m.value}
              </span>
              <p className="font-body font-light text-gray-600 text-sm leading-relaxed">
                {m.label}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
