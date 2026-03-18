import Link from "next/link";
import Logo from "@/components/ui/Logo";
import type { ContactData } from "@/lib/contacts";

interface Props {
  contact: Pick<ContactData, "nombre" | "empresa"> | null;
  token: string | null;
}

export default function Hero({ contact, token }: Props) {
  const headline = contact
    ? `Hola ${contact.nombre}, encontremos el speaker ideal para ${contact.empresa}`
    : "El speaker correcto transforma un evento";

  const ctaHref = token ? `/start?t=${token}` : "/start";

  return (
    <section className="bg-white pt-header pb-section">
      <div className="container-page flex flex-col items-center text-center">

        <div className="mb-10 animate-fade-slide-in">
          <Logo size="md" />
        </div>

        <h1
          className="text-display font-heading font-extrabold tracking-tight text-black leading-none mb-6 animate-fade-slide-in"
          style={{ animationDelay: "80ms" }}
        >
          {contact ? (
            <>
              Hola <span className="whitespace-nowrap">{contact.nombre}</span>, encontremos el speaker ideal para{" "}
              <span className="whitespace-nowrap">{contact.empresa}</span>
            </>
          ) : (
            "El speaker correcto transforma un evento"
          )}
        </h1>

        <p
          className="text-lead font-body font-light text-black max-w-2xl leading-relaxed mb-8 animate-fade-slide-in"
          style={{ animationDelay: "160ms" }}
        >
          Matching personalizado con los mejores speakers de México para tu evento corporativo
        </p>

        <div
          className="flex flex-col items-center gap-4 animate-fade-slide-in"
          style={{ animationDelay: "240ms" }}
        >
          <Link
            href={ctaHref}
            className="btn-primary-typo bg-black text-white px-12 py-5 text-sm tracking-widest uppercase transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 hover:shadow-md"
          >
            Encuentra un speaker
          </Link>
          <p className="text-micro font-body text-gray-500 tracking-wide">
            Sin costo · Sin compromiso · Propuesta en 24 hrs
          </p>
        </div>

      </div>
    </section>
  );
}
