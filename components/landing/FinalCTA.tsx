import Link from "next/link";
import MagneticButton from "@/components/ui/MagneticButton";
import FinalCTAAnimator from "@/components/ui/FinalCTAAnimator";

interface Props {
  token: string | null;
}

const HEADLINE = "Las agendas de los mejores speakers ya se están llenando";

export default function FinalCTA({ token }: Props) {
  const href = token ? `/start?t=${token}` : "/start";
  const words = HEADLINE.split(" ");

  return (
    <section className="cta-section bg-black pt-section pb-section">
      <div className="container-page flex flex-col items-center text-center">

        {/* Headline — each word is individually animated */}
        <h2
          className="font-heading font-extrabold text-white leading-tight max-w-3xl mb-4"
          style={{ fontSize: "clamp(1.5rem, 3vw + 0.5rem, 2.75rem)" }}
        >
          {words.map((word, i) => (
            <span
              key={i}
              className="inline-block overflow-hidden"
              style={{ verticalAlign: "bottom", paddingBottom: "0.08em" }}
            >
              <span className="cta-word inline-block">
                {word}
              </span>
              {i < words.length - 1 && "\u00A0"}
            </span>
          ))}
        </h2>

        <p className="cta-sub font-body font-light text-gray-400 text-lg mb-10 max-w-xl">
          Empieza hoy — tu propuesta llega en menos de 24 horas
        </p>

        <div className="cta-btn">
          <MagneticButton>
            <Link
              href={href}
              className="cta-btn-link btn-primary-typo bg-white text-black px-12 py-5 text-sm tracking-widest uppercase transition-opacity duration-200 hover:opacity-90 inline-block"
            >
              Encuentra tu speaker
            </Link>
          </MagneticButton>
        </div>

        <p className="cta-micro text-micro font-body text-gray-600 tracking-wide mt-5">
          Sin costo · Sin compromiso · Propuesta en 24 hrs
        </p>

      </div>

      <FinalCTAAnimator />
    </section>
  );
}
