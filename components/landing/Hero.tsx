import Link from "next/link";
import Logo from "@/components/ui/Logo";
import HeroAnimator from "@/components/ui/HeroAnimator";
import MagneticButton from "@/components/ui/MagneticButton";
import type { ContactData } from "@/lib/contacts";

interface Props {
  contact: Pick<ContactData, "nombre" | "empresa"> | null;
  token: string | null;
}

export default function Hero({ contact, token }: Props) {
  const ctaHref = token ? `/start?t=${token}` : "/start";

  return (
    <section
      className="hero-section bg-white min-h-screen flex flex-col justify-between"
      style={{ paddingTop: "var(--space-header-pt)" }}
    >
      {/* Top bar */}
      <div className="container-page flex justify-between items-center pb-8">
        <Logo size="sm" />
        <span
          className="font-body text-[10px] tracking-[0.25em] uppercase"
          style={{ color: "#aaa" }}
        >
          Agencia de Speaker Matching
        </span>
      </div>

      {/* Landmark tipográfico */}
      <div className="flex-1 flex flex-col justify-center overflow-hidden">
        <div className="container-page">

          {/* "SPEAKER" — chars individually animated */}
          <div
            className="hero-line-speaker font-heading font-extrabold text-black leading-none tracking-tighter select-none overflow-hidden"
            style={{ fontSize: "clamp(3.5rem, 13vw, 14rem)" }}
            aria-hidden="true"
          >
            {"SPEAKER".split("").map((char, i) => (
              <span key={i} className="hero-char inline-block">
                {char}
              </span>
            ))}
          </div>

          {/* "MATCH®" + payload */}
          <div className="flex items-end justify-between gap-6 mt-0">
            <div
              className="hero-line-match font-heading font-extrabold text-black leading-none tracking-tighter select-none overflow-hidden shrink-0 p-5"
              style={{ fontSize: "clamp(3.5rem, 13vw, 14rem)", letterSpacing: "0.02em" }}
              aria-hidden="true"
            >
              {"MATCH".split("").map((char, i) => (
                <span key={i} className="hero-char inline-block">
                  {char}
                </span>
              ))}
              <sup
                className="hero-char inline-block"
                style={{ fontSize: "0.18em", verticalAlign: "super" }}
              >
                ®
              </sup>
            </div>

            {/* Payload desktop */}
            <div className="hero-payload hidden sm:flex flex-col items-start pb-3 lg:pb-5 shrink-0 max-w-[260px] lg:max-w-sm">
              <p className="font-body font-light text-black text-sm lg:text-base leading-snug mb-5">
                {contact
                  ? `Hola ${contact.nombre}, encontremos el speaker ideal para ${contact.empresa}`
                  : "El speaker correcto transforma un evento empresarial."}
              </p>
              <MagneticButton>
                <Link
                  href={ctaHref}
                  className="btn-primary-typo bg-black text-white px-7 py-3 text-[11px] tracking-[0.2em] uppercase transition-opacity duration-200 hover:opacity-80 inline-flex items-center gap-2"
                >
                  Encuentra un speaker
                  <span aria-hidden>→</span>
                </Link>
              </MagneticButton>
              <p
                className="font-body text-[10px] tracking-widest uppercase mt-3"
                style={{ color: "#bbb" }}
              >
                Sin costo · Sin compromiso · 24 hrs
              </p>
            </div>
          </div>

          {/* Payload mobile */}
          <div className="hero-payload sm:hidden flex flex-col mt-8">
            <div className="w-10 h-px bg-black mb-6" />
            <p className="font-body font-light text-black text-base leading-snug mb-6 max-w-xs">
              {contact
                ? `Hola ${contact.nombre}, encontremos el speaker ideal para ${contact.empresa}`
                : "El speaker correcto transforma un evento empresarial."}
            </p>
            <MagneticButton>
              <Link
                href={ctaHref}
                className="btn-primary-typo bg-black text-white px-7 py-4 text-[11px] tracking-[0.2em] uppercase transition-opacity duration-200 hover:opacity-80 inline-flex items-center gap-2"
              >
                Encuentra un speaker
                <span aria-hidden>→</span>
              </Link>
            </MagneticButton>
            <p
              className="font-body text-[10px] tracking-widest uppercase mt-3"
              style={{ color: "#bbb" }}
            >
              Sin costo · Sin compromiso · 24 hrs
            </p>
          </div>

        </div>
      </div>

      {/* Screen reader headline */}
      <h1 className="sr-only">
        {contact
          ? `Hola ${contact.nombre}, encontremos el speaker ideal para ${contact.empresa}`
          : "Speaker Match — El speaker correcto transforma un evento"}
      </h1>

      {/* Bottom rule */}
      <div
        className="hero-footer container-page border-t"
        style={{ borderColor: "#eee" }}
      >
        <p
          className="font-body text-[10px] tracking-[0.2em] uppercase py-5"
          style={{ color: "#bbb" }}
        >
          Speakers México · Matching para eventos corporativos
        </p>
      </div>

      {/* GSAP timeline — runs after hydration, targets .hero-char etc. */}
      <HeroAnimator />
    </section>
  );
}
