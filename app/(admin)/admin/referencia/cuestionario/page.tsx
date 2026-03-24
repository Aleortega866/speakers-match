import ReferenceCuestionarioContent from "@/components/admin/reference/ReferenceCuestionarioContent";
import { getAdminMatchStepsForReference } from "@/lib/admin/reference";

export const metadata = {
  title: "Cuestionario · Referencia · Admin",
};

export default async function AdminReferenciaCuestionarioPage() {
  const steps = await getAdminMatchStepsForReference();

  return (
    <article className="animate-fade-slide-in space-y-6 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
      <header className="space-y-2">
        <p className="text-micro font-black uppercase tracking-widest text-black/50">Referencia</p>
        <h1 className="font-heading text-3xl font-extrabold text-black md:text-4xl">Cuestionario</h1>
        <p className="text-sm text-black/65 sm:text-base">
          Preguntas y opciones tal como las ve quien completa el formulario.
        </p>
      </header>
      <ReferenceCuestionarioContent steps={steps} />
    </article>
  );
}
