import type { AdminMatchStepRow } from "@/lib/admin/reference";

export default function ReferenceCuestionarioContent({ steps }: { steps: AdminMatchStepRow[] }) {
  if (steps.length === 0) {
    return <p className="mt-4 text-sm text-black/50">No hay pasos activos en base de datos.</p>;
  }

  return (
    <ol className="mt-6 space-y-6">
      {steps.map((step, idx) => (
        <li key={step.id} className="rounded-2xl border border-black/10 bg-black/2 px-4 py-4">
          <p className="text-micro font-black uppercase tracking-widest text-black/45">
            Pregunta {idx + 1} · orden {step.orden}
          </p>
          <p className="mt-2 text-base font-semibold leading-snug text-black">{step.question}</p>
          {step.options.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {step.options.map((opt) => (
                <li
                  key={opt.id}
                  className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/80"
                >
                  {opt.label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-black/45">Sin opciones listadas (texto libre o sin opciones en BD).</p>
          )}
        </li>
      ))}
    </ol>
  );
}
