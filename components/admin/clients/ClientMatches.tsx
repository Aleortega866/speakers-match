import type { AdminClientMatch } from "@/lib/admin/types";

/**
 * Matches de cliente — mismo lenguaje visual que el detalle admin:
 * Montserrat/Barlow, bordes black/10, sombras suaves, acentos ámbar (top) y esmeralda (compat).
 */
export default function ClientMatches({ matches }: { matches: AdminClientMatch[] }) {
  if (matches.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-black/15 bg-white p-6 text-sm font-body text-black/60">
        Aun no hay conferencistas recomendados para este cliente.
      </div>
    );
  }

  return (
    <div className="space-y-6 font-body">
      {matches.map((match, index) => (
        <article
          key={match.id}
          className={`animate-fade-slide-in group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md ${
            index === 0
              ? "border-black/15 ring-1 ring-amber-400/35"
              : "border-black/10"
          }`}
          style={{ animationDelay: `${index * 70}ms` }}
        >
          <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-stretch lg:gap-8 lg:p-8">
            {/* Identidad — misma distribución; columna ocupa 100% de alto y centra el bloque */}
            <div className="order-2 flex shrink-0 flex-col items-center justify-center gap-3 sm:flex-row sm:items-start lg:order-1 lg:w-44 lg:flex-col lg:items-center lg:justify-center lg:self-stretch">
              <div className="relative shrink-0">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-black text-xl font-heading font-extrabold tracking-tight text-white shadow-inner ring-4 ring-black/5 transition group-hover:ring-black/10">
                  {initials(match.speaker.name)}
                </div>
                {index === 0 ? (
                  <span className="absolute -right-1 -top-1 rounded-full border border-amber-200 bg-amber-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-900">
                    Top
                  </span>
                ) : null}
              </div>
              <div className="text-center sm:text-left lg:text-center">
                <p className="text-micro font-body font-black uppercase tracking-[0.2em] text-black/40">Match</p>
                <p className="mt-1 font-heading text-2xl font-extrabold tabular-nums text-black">{match.score}%</p>
                <span
                  className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${
                    index === 0
                      ? "border border-amber-200 bg-amber-50 text-amber-900"
                      : "border border-black/10 bg-black/2 text-black/80"
                  }`}
                >
                  Ranking {index + 1}
                </span>
              </div>
            </div>

            {/* Contenido */}
            <div className="order-3 min-w-0 flex-1 border-t border-black/10 pt-6 lg:order-2 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <h3 className="font-heading text-2xl font-extrabold leading-tight tracking-tight text-black md:text-3xl">
                {match.speaker.name}
              </h3>
              <p className="mt-2 text-lead font-body font-light leading-snug text-black/70">{match.speaker.specialty}</p>

              {match.speaker.bio ? (
                <p className="mt-3 line-clamp-2 text-sm font-body font-light leading-relaxed text-black/50">
                  {match.speaker.bio}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                  {match.score}% compatibilidad
                </span>
                {match.topSkill ? (
                  <span className="rounded-full border border-black/10 bg-black/2 px-3 py-1 text-xs font-semibold text-black">
                    Enfoque · {match.topSkill}
                  </span>
                ) : null}
              </div>

              <div className="mt-6">
                <p className="text-micro font-body font-black uppercase tracking-widest text-black/45">Skills</p>
                <div className="mt-3 max-w-xl space-y-3">
                  {match.skills.length > 0 ? (
                    match.skills.slice(0, 6).map((skill) => {
                      const pct = Math.max(0, Math.min(100, skill.value * 10));
                      return (
                        <div key={skill.label} className="flex items-center gap-3">
                          <span className="w-[120px] shrink-0 text-sm font-medium capitalize text-black/70 sm:w-[140px]">
                            {skill.label}
                          </span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/10">
                            <div
                              className="h-full rounded-full bg-linear-to-r from-black to-black/75"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="min-w-[40px] shrink-0 text-right text-sm font-semibold tabular-nums text-black">
                            {formatSkillValue(skill.value)}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-black/45">Sin breakdown de skills disponible.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Acciones — arriba en móvil; columna derecha alineada arriba en desktop */}
            <div className="order-1 flex flex-row flex-wrap justify-end gap-2 border-b border-black/10 bg-black/2 p-3 lg:order-3 lg:w-44 lg:flex-col lg:flex-nowrap lg:justify-start lg:self-start lg:border-b-0 lg:border-l lg:border-black/10 lg:bg-transparent lg:p-0 lg:pl-6">
              <button
                type="button"
                className="btn-primary-typo rounded-full border border-black/15 bg-white px-3 py-1.5 text-[10px] tracking-[0.14em] text-black uppercase transition hover:-translate-y-0.5 hover:shadow-sm sm:px-4"
              >
                Perfil
              </button>
              <button
                type="button"
                className="btn-primary-typo rounded-full bg-black px-3 py-1.5 text-[10px] tracking-[0.14em] text-white uppercase transition hover:-translate-y-0.5 hover:opacity-95 sm:px-4"
              >
                Contactar
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatSkillValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
