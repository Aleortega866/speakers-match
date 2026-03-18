const speakers = [
  {
    num: "01",
    nombre: "Alejandro Meza",
    tema: "Liderazgo · Innovación",
    stat: "+80 conferencias",
  },
  {
    num: "02",
    nombre: "Sofía Ramírez",
    tema: "Motivación · Bienestar",
    stat: "+120 conferencias",
  },
  {
    num: "03",
    nombre: "Carlos Ibáñez",
    tema: "Ventas · Alta Dirección",
    stat: "+200 conferencias",
  },
];

export default function SpeakerShowcase() {
  return (
    <section className="bg-white pt-section pb-section">
      <div className="container-page">

        {/* Header editorial */}
        <div className="flex items-end justify-between mb-12 gap-4">
          <p className="font-body text-[10px] tracking-[0.25em] uppercase" style={{ color: "#bbb" }}>
            Speakers del catálogo
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-px" style={{ background: "#ddd" }} />
            <span className="font-body text-[10px] tracking-[0.15em] uppercase" style={{ color: "#bbb" }}>
              +200 disponibles
            </span>
          </div>
        </div>

        {/* Speaker entries — editorial numeradas */}
        <div className="flex flex-col divide-y" style={{ borderColor: "#eee" }}>
          {speakers.map((s) => (
            <div
              key={s.num}
              className="flex items-start gap-6 py-8 group"
            >
              {/* Número de orden */}
              <span
                className="font-heading font-extrabold text-black leading-none shrink-0 select-none"
                style={{
                  fontSize: "clamp(2rem, 5vw, 4.5rem)",
                  opacity: 0.07,
                  minWidth: "4rem",
                  lineHeight: 1,
                }}
                aria-hidden
              >
                {s.num}
              </span>

              {/* Foto placeholder */}
              <div
                className="w-16 h-20 shrink-0 bg-gray-100"
                style={{ marginTop: "0.1rem" }}
              />

              {/* Datos */}
              <div className="flex flex-col flex-1 min-w-0">
                <span
                  className="font-heading font-extrabold text-black leading-tight"
                  style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.75rem)" }}
                >
                  {s.nombre}
                </span>
                <span
                  className="font-body text-[11px] tracking-[0.15em] uppercase mt-1 mb-3"
                  style={{ color: "#999" }}
                >
                  {s.tema}
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-px" style={{ background: "#ccc" }} />
                  <span className="font-body text-xs" style={{ color: "#aaa" }}>
                    {s.stat}
                  </span>
                </div>
              </div>

              {/* Badge disponible */}
              <div className="hidden sm:flex items-center self-center shrink-0">
                <span
                  className="font-body text-[10px] tracking-[0.2em] uppercase border px-3 py-1.5"
                  style={{ borderColor: "#e5e5e5", color: "#999" }}
                >
                  Disponible
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Contador total — editorial, al pie de la lista */}
        <div className="border-t pt-8 flex items-center justify-between" style={{ borderColor: "#eee" }}>
          <div className="flex items-baseline gap-3">
            <span
              className="font-heading font-extrabold text-black leading-none"
              style={{ fontSize: "clamp(2rem, 6vw, 5rem)" }}
            >
              +200
            </span>
            <span
              className="font-body text-[11px] tracking-[0.15em] uppercase"
              style={{ color: "#aaa" }}
            >
              speakers en catálogo
            </span>
          </div>
          <p className="font-body font-light text-sm text-right max-w-[200px] hidden sm:block" style={{ color: "#888" }}>
            Tu propuesta incluirá los más alineados a tu evento
          </p>
        </div>

      </div>
    </section>
  );
}
