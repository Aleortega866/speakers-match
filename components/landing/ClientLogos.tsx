import LogoMarquee from "@/components/landing/LogoMarquee";
import Reveal from "@/components/ui/Reveal";

export default function ClientLogos() {
  return (
    <section className="bg-white pb-section border-t border-gray-100">
      <div className="container-page pt-section flex flex-col gap-8">
        <Reveal>
          <p className="text-micro font-body font-black tracking-widest uppercase text-black text-center">
            Confían en nosotros
          </p>
        </Reveal>
        <Reveal delay={120}>
          <LogoMarquee />
        </Reveal>
      </div>
    </section>
  );
}
