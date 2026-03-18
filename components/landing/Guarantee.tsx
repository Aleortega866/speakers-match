import Reveal from "@/components/ui/Reveal";

export default function Guarantee() {
  return (
    <section className="bg-[#111] pt-section pb-section">
      <div className="container-page flex flex-col items-center text-center">
        <Reveal>
          <p className="text-micro font-body tracking-widest uppercase text-gray-500 mb-6">
            Nuestra garantía
          </p>

          <h2
            className="font-heading font-extrabold text-white leading-tight max-w-3xl mb-6"
            style={{ fontSize: "clamp(1.5rem, 3vw + 0.5rem, 2.5rem)" }}
          >
            Si no encontramos al speaker adecuado para tu evento, te decimos por qué — sin rodeos y sin cobrarte nada.
          </h2>

          <p className="font-body font-light text-gray-400 text-lg">
            Así de simple es nuestra garantía.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
