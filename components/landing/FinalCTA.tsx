import Link from "next/link";
import Reveal from "@/components/ui/Reveal";

interface Props {
  token: string | null;
}

export default function FinalCTA({ token }: Props) {
  const href = token ? `/start?t=${token}` : "/start";

  return (
    <section className="bg-black pt-section pb-section">
      <div className="container-page flex flex-col items-center text-center">
        <Reveal>
          <h2
            className="font-heading font-extrabold text-white leading-tight max-w-3xl mb-4"
            style={{ fontSize: "clamp(1.5rem, 3vw + 0.5rem, 2.75rem)" }}
          >
            Las agendas de los mejores speakers ya se están llenando
          </h2>

          <p className="font-body font-light text-gray-400 text-lg mb-10 max-w-xl">
            Empieza hoy — tu propuesta llega en menos de 24 horas
          </p>

          <Link
            href={href}
            className="btn-primary-typo bg-white text-black px-12 py-5 text-sm tracking-widest uppercase transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 hover:shadow-lg"
          >
            Encuentra tu speaker
          </Link>

          <p className="text-micro font-body text-gray-600 tracking-wide mt-5">
            Sin costo · Sin compromiso · Propuesta en 24 hrs
          </p>
        </Reveal>
      </div>
    </section>
  );
}
