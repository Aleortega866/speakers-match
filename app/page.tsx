import { findContactByToken } from "@/lib/contacts";
import Hero from "@/components/landing/Hero";
import ClientLogos from "@/components/landing/ClientLogos";
import HowItWorks from "@/components/landing/HowItWorks";
import SpeakerShowcase from "@/components/landing/SpeakerShowcase";
import WhyUs from "@/components/landing/WhyUs";
import Testimonials from "@/components/landing/Testimonials";
import Guarantee from "@/components/landing/Guarantee";
import FAQWrapper from "@/components/landing/FAQWrapper";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const contact = t
    ? await findContactByToken(t).catch(() => null)
    : null;

  return (
    <main>
      <Hero
        contact={contact ? { nombre: contact.nombre, empresa: contact.empresa } : null}
        token={t ?? null}
      />
      <ClientLogos />
      <HowItWorks />
      <SpeakerShowcase />
      <WhyUs />
      <Testimonials />
      <Guarantee />
      <FAQWrapper />
      <FinalCTA token={t ?? null} />
      <Footer />
    </main>
  );
}
