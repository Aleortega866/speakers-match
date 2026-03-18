import Image from "next/image";

const logos = [
  { name: "BBVA", src: "/logo-bbva.png" },
  { name: "Nissan", src: "/logo-nissan.svg" },
  { name: "Quálitas", src: "/logo-qualitas.png" },
  { name: "Ingredion", src: "/logo-ingredion.png" },
  { name: "KPMG", src: "/logo-kpmg.png" },
];

const INVERTED_LOGOS = new Set(["BBVA", "Quálitas", "Ingredion", "Nissan"]);

export default function ClientLogos() {
  return (
    <section className="bg-white pb-section border-t border-gray-100">
      <div className="container-page pt-section flex flex-col gap-logos lg:flex-row lg:items-center lg:justify-center">
        <p className="text-micro font-body font-black tracking-widest uppercase text-black text-center lg:text-left lg:whitespace-nowrap shrink-0">
          Confían en<br className="hidden lg:block" /> nosotros
        </p>
        <div className="flex flex-wrap items-center justify-center gap-logos">
          {logos.map((logo) => (
            <div
              key={logo.name}
              className="relative h-10 w-20 sm:h-12 sm:w-24 md:h-14 md:w-28 shrink-0"
            >
              <Image
                src={logo.src}
                alt={logo.name}
                fill
                className={`object-contain grayscale opacity-60 ${
                  INVERTED_LOGOS.has(logo.name) ? "invert" : ""
                }`}
                sizes="(max-width: 576px) 80px, (max-width: 768px) 96px, 112px"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
