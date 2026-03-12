import Image from "next/image";
import Logo from "@/components/ui/Logo";
import IntakeForm from "@/components/intake/IntakeForm";

const logos = [
  { name: "BBVA", src: "/logo-bbva.png" },
  { name: "Nissan", src: "/logo-nissan.svg" },
  { name: "Quálitas", src: "/logo-qualitas.png" },
  { name: "Ingredion", src: "/logo-ingredion.png" },
  { name: "KPMG", src: "/logo-kpmg.png" },
];

// js-set-map-lookups: Set a nivel de modulo → O(1), sin allocations en cada render
const INVERTED_LOGOS = new Set(["BBVA", "Quálitas", "Ingredion", "Nissan"]);

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white flex flex-col">

      {/* Header */}
      <header className="flex justify-center pt-header pb-6 sm:pb-8 animate-fade-slide-in">
        <Logo size="md" />
      </header>

      {/* Hero */}
      <section className="container-page pt-section pb-section flex flex-col items-center text-center flex-1">

        <h1 className="text-display font-heading font-extrabold tracking-tight text-black mb-10 leading-none animate-fade-slide-in">
          SpeakerMatch<sup className="text-xl">®</sup>
        </h1>

        <p
          className="text-lead font-body font-light text-black max-w-4xl leading-relaxed mb-6 animate-fade-slide-in"
          style={{ animationDelay: "120ms" }}
        >
          Transforma el año de tu empresa antes de que el calendario te alcance.
          <br className="hidden sm:block" />
          &nbsp;Descubre al speaker adecuado que genere un verdadero impacto
        </p>

        <div
          className="animate-fade-slide-in w-full flex flex-col items-center"
          style={{ animationDelay: "220ms" }}
        >
          <IntakeForm />
        </div>

        {/* Social proof: logos */}
        <div className="mt-12 pt-12 w-full max-w-5xl flex flex-col gap-logos lg:flex-row lg:items-center lg:justify-center">
          <p
            className="text-micro font-body font-black tracking-widest uppercase text-black text-center lg:text-left lg:whitespace-nowrap shrink-0 animate-fade-slide-in"
            style={{ animationDelay: "300ms" }}
          >
            Confían en<br className="hidden lg:block" /> nosotros
          </p>
          <div className="flex flex-wrap items-center justify-center gap-logos">
            {logos.map((logo, i) => (
              <div
                key={logo.name}
                className="relative h-10 w-20 sm:h-12 sm:w-24 md:h-14 md:w-28 shrink-0 animate-fade-slide-in"
                style={{ animationDelay: `${380 + i * 80}ms` }}
              >
                <Image
                  src={logo.src}
                  alt={logo.name}
                  fill
                  className={`object-contain grayscale opacity-70 ${
                    INVERTED_LOGOS.has(logo.name) ? "invert" : ""
                  }`}
                  sizes="(max-width: 576px) 80px, (max-width: 768px) 96px, 112px"
                />
              </div>
            ))}
          </div>
        </div>

      </section>
    </main>
  );
}
