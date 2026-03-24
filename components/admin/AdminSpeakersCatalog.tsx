import Link from "next/link";
import AvatarInitials from "@/components/admin/AvatarInitials";
import { StatCard } from "@/components/admin/AdminCards";
import type { AdminSpeakerListResult } from "@/lib/admin/types";

function buildListHref(params: {
  search?: string;
  page?: number;
  pageSize?: string;
}): string {
  const sp = new URLSearchParams();
  if (params.search?.trim()) sp.set("search", params.search.trim());
  if (params.page != null && params.page > 1) sp.set("page", String(params.page));
  if (params.pageSize && params.pageSize !== "20") sp.set("pageSize", params.pageSize);
  const q = sp.toString();
  return q ? `/admin/conferencistas?${q}` : "/admin/conferencistas";
}

export default function AdminSpeakersCatalog({
  result,
  kpis,
  search,
  pageSize,
}: {
  result: AdminSpeakerListResult;
  kpis: { total: number; active: number; inactive: number };
  search: string;
  pageSize: string;
}) {
  const searchTrim = search.trim();
  const prevHref = buildListHref({
    search,
    page: result.page > 1 ? result.page - 1 : 1,
    pageSize,
  });
  const nextHref = buildListHref({
    search,
    page: result.page + 1,
    pageSize,
  });

  return (
    <section className="space-y-6 font-body text-black">
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-micro font-black uppercase tracking-widest text-black/50">Conferencistas</p>
        <h1 className="mt-2 font-heading text-3xl font-extrabold text-black md:text-4xl">Catálogo</h1>
        <p className="mt-2 text-sm text-black/65 sm:text-base">
          Listado del equipo de speakers con búsqueda (solo lectura).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Total"
          value={kpis.total.toLocaleString("es-MX")}
          helper={
            searchTrim
              ? "Personas que coinciden con tu búsqueda."
              : "Todos los conferencistas en base de datos."
          }
        />
        <StatCard
          label="Activos"
          value={kpis.active.toLocaleString("es-MX")}
          helper="En catálogo y disponibles para matching (respeta la búsqueda si hay texto)."
        />
        <StatCard
          label="Inactivos"
          value={kpis.inactive.toLocaleString("es-MX")}
          helper="Pausados (respeta la búsqueda si hay texto)."
        />
      </div>

      <p className="text-sm text-black/55">
        Mostrando página {result.page} ({result.pageSize} filas por página)
        {result.hasNext ? " — hay más abajo en las siguientes páginas." : " — no hay más páginas."}
      </p>

      <div className="rounded-2xl border border-black/10 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 px-5 py-4">
          <h3 className="font-heading text-xl font-bold text-black">Lista de conferencistas</h3>
          <form className="flex flex-wrap items-center gap-2" action="/admin/conferencistas" method="get">
            <input type="hidden" name="pageSize" value={pageSize} />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Buscar por nombre, especialidad o bio"
              className="w-64 rounded-xl border border-black/15 bg-white px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
            >
              Buscar
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full">
            <thead>
              <tr className="border-b border-black/10 bg-black/2 text-left text-micro font-black uppercase tracking-widest text-black/45">
                <th className="px-4 py-3">Speaker</th>
                <th className="px-4 py-3">Especialidad</th>
                <th className="hidden px-4 py-3 lg:table-cell">Bio</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((s) => (
                <tr key={s.id} className="border-b border-black/5 text-sm text-black/90 last:border-0">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <AvatarInitials name={s.nombre} muted={!s.active} />
                      <div className="min-w-0">
                        <p className="font-semibold text-black">{s.nombre}</p>
                        <p className="text-xs text-black/50">#{s.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex rounded-full border border-black/10 bg-black/2 px-2.5 py-1 text-xs font-bold text-black/85">
                      {s.especialidad || "—"}
                    </span>
                  </td>
                  <td className="hidden max-w-md px-4 py-4 lg:table-cell">
                    <p className="line-clamp-2 text-sm text-black/55" title={s.bio_short ?? undefined}>
                      {s.bio_short ?? "—"}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${
                        s.active
                          ? "border-black/10 bg-black/2 text-black/85"
                          : "border-black/10 bg-black/5 text-black/50"
                      }`}
                    >
                      {s.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                </tr>
              ))}
              {result.items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-black/50">
                    No hay conferencistas para esta búsqueda.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {result.total > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 px-5 py-4">
            <p className="text-xs text-black/45">Los inactivos permanecen en base para historial de matches.</p>
            <div className="flex items-center gap-2">
              {result.page > 1 ? (
                <Link
                  href={prevHref}
                  className="rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-black/5"
                >
                  ← Anterior
                </Link>
              ) : (
                <span className="rounded-xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-semibold text-black/35">
                  ← Anterior
                </span>
              )}
              {result.hasNext ? (
                <Link
                  href={nextHref}
                  className="rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-black/5"
                >
                  Siguiente →
                </Link>
              ) : (
                <span className="rounded-xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-semibold text-black/35">
                  Siguiente →
                </span>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
