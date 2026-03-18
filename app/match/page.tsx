import Logo from "@/components/ui/Logo";
import MatchForm from "@/components/match/MatchForm";
import GuaranteePanel from "@/components/match/GuaranteePanel";
import { getMatchSteps } from "@/lib/matchSteps";

export default async function MatchPage() {
  const steps = await getMatchSteps();

  return (
    <main className="min-h-screen bg-white">
      <div className="flex min-h-screen">
        {/* Left column — form */}
        <div className="flex-1 px-[var(--space-inline)] pt-header pb-section flex flex-col">
          {/* Logo */}
          <div className="mb-8 animate-fade-slide-in">
            <Logo size="sm" />
          </div>

          {/* Title */}
          <div className="mb-8 animate-fade-slide-in" style={{ animationDelay: "80ms" }}>
            <h1 className="text-display font-heading font-extrabold text-black leading-none mb-5">
              SpeakerMatch<sup className="text-xl">®</sup>
            </h1>
            <p className="text-lead font-body font-light text-black leading-relaxed max-w-md">
              Completa las siguientes preguntas para obtener una propuesta con
              speakers que hacen sentido con tus objetivos
            </p>
          </div>

          {/* Form */}
          <div className="animate-fade-slide-in" style={{ animationDelay: "160ms" }}>
            <MatchForm steps={steps} />
          </div>
        </div>

        {/* Right column — guarantee panel */}
        <aside className="hidden md:flex md:flex-col w-80 lg:w-96 shrink-0 h-screen">
          <div className="sticky top-0 flex-1 flex flex-col min-h-0">
            <GuaranteePanel />
          </div>
        </aside>
      </div>
    </main>
  );
}
