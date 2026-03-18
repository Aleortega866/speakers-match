import GuaranteeAnimator from "@/components/ui/GuaranteeAnimator";

const HEADLINE =
  "Si no encontramos al speaker adecuado para tu evento, te decimos por qué — sin rodeos y sin cobrarte nada.";

export default function Guarantee() {
  const words = HEADLINE.split(" ");

  return (
    <section className="guarantee-section bg-[#111] pt-section pb-section">
      <div className="container-page flex flex-col items-center text-center">

        {/* Línea decorativa que se dibuja al entrar */}
        <div
          className="guarantee-line w-12 h-px mb-8"
          style={{ background: "#444" }}
        />

        <p className="guarantee-label text-micro font-body tracking-widest uppercase text-gray-500 mb-6">
          Nuestra garantía
        </p>

        <h2
          className="font-heading font-extrabold text-white leading-tight max-w-3xl mb-6"
          style={{ fontSize: "clamp(1.5rem, 3vw + 0.5rem, 2.5rem)" }}
        >
          {words.map((word, i) => (
            <span
              key={i}
              className="inline-block overflow-hidden"
              style={{ verticalAlign: "bottom", paddingBottom: "0.08em" }}
            >
              <span className="guarantee-word inline-block">{word}</span>
              {i < words.length - 1 && "\u00A0"}
            </span>
          ))}
        </h2>

        <p className="guarantee-closing font-body font-light text-gray-400 text-lg">
          Así de simple es nuestra garantía.
        </p>

      </div>

      <GuaranteeAnimator />
    </section>
  );
}
