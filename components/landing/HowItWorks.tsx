const steps = [
  {
    num: "01",
    title: "Completa el match",
    description: "5 preguntas sobre tu evento y audiencia. Menos de 3 minutos.",
  },
  {
    num: "02",
    title: "Recibe tu propuesta",
    description: "En menos de 24 horas con speakers alineados a tus objetivos y presupuesto.",
  },
  {
    num: "03",
    title: "Agenda tu llamada",
    description: "Confirma al speaker y cierra los detalles con nuestro equipo.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-[#f5f5f5] pt-section pb-section">
      <div className="container-page">

        <h2 className="text-display font-heading font-extrabold text-black leading-none mb-12 text-center">
          Cómo funciona
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 max-w-4xl mx-auto">
          {steps.map((step) => (
            <div key={step.num} className="flex flex-col">
              <span className="font-heading font-extrabold text-[4rem] leading-none text-black mb-4 select-none">
                {step.num}
              </span>
              <h3 className="font-heading font-bold text-xl text-black mb-3">
                {step.title}
              </h3>
              <p className="font-body font-light text-gray-600 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
