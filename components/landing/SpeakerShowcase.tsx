const speakers = [
  {
    nombre: "Alejandro Meza",
    tema: "Liderazgo · Innovación",
    stat: "+80 conferencias",
  },
  {
    nombre: "Sofía Ramírez",
    tema: "Motivación · Bienestar",
    stat: "+120 conferencias",
  },
  {
    nombre: "Carlos Ibáñez",
    tema: "Ventas · Alta Dirección",
    stat: "+200 conferencias",
  },
];

export default function SpeakerShowcase() {
  return (
    <section className="bg-white pt-section pb-section">
      <div className="container-page">

        <h2 className="text-display font-heading font-extrabold text-black leading-none mb-4 text-center">
          Speakers del catálogo
        </h2>
        <p className="font-body font-light text-gray-500 text-center mb-12 max-w-xl mx-auto">
          Una muestra de los perfiles disponibles. Tu propuesta incluirá los más alineados a tu evento.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {speakers.map((speaker) => (
            <div
              key={speaker.nombre}
              className="border border-gray-200 bg-white overflow-hidden"
            >
              {/* Foto placeholder */}
              <div className="h-48 bg-gray-200 w-full" />

              <div className="p-5">
                <p className="font-heading font-bold text-black text-base mb-1">
                  {speaker.nombre}
                </p>
                <p className="font-body text-sm text-gray-500 mb-3">
                  {speaker.tema}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-body text-xs text-gray-400">
                    {speaker.stat}
                  </span>
                  <span className="text-xs font-semibold text-black border border-black px-2 py-0.5 tracking-wide">
                    Disponible
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Card contadora — 4ª celda, sin spanning */}
          <div className="bg-black flex flex-col items-center justify-center py-16 sm:py-0 sm:min-h-[240px]">
            <span className="font-heading font-extrabold text-white leading-none" style={{ fontSize: "clamp(3rem, 6vw, 5rem)" }}>
              +200
            </span>
            <span className="text-micro font-body text-gray-400 tracking-widest uppercase mt-2">
              speakers
            </span>
            <span className="font-body text-xs text-gray-600 mt-1 text-center px-6">
              en nuestro catálogo
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}
