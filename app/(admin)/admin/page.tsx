import Link from "next/link";
import AvatarInitials from "@/components/admin/AvatarInitials";
import { StatCard } from "@/components/admin/AdminCards";
import { getAdminDashboardSnapshot } from "@/lib/admin/dashboard";

export const metadata = {
  title: "Dashboard · Admin",
};

export default async function AdminDashboardPage() {
  let snapshot: Awaited<ReturnType<typeof getAdminDashboardSnapshot>> | null = null;
  let error = false;

  try {
    snapshot = await getAdminDashboardSnapshot();
  } catch {
    error = true;
  }

  if (error || !snapshot) {
    return (
      <section className="space-y-6 font-body text-black">
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6">
          <p className="text-micro font-black uppercase tracking-widest text-amber-800">Dashboard</p>
          <h1 className="mt-2 font-heading text-2xl font-extrabold text-amber-950">No se pudo cargar el resumen</h1>
          <p className="mt-2 text-sm text-amber-900">Revisa la conexión a la base de datos y vuelve a intentar.</p>
        </div>
      </section>
    );
  }

  const { totals, recentContacts, statusCounts } = snapshot;

  return (
    <section className="space-y-8 font-body text-black">
      <header className="animate-fade-slide-in space-y-2">
        <p className="text-micro font-body font-black uppercase tracking-widest text-black/50">Inicio</p>
        <h1 className="font-heading text-3xl font-extrabold leading-none md:text-4xl">Panel</h1>
        <p className="mt-2 text-sm text-black/65 sm:text-base">
          Resumen de números clave y últimos contactos.
        </p>
      </header>

      {/* Totales generales */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Contactos totales"
          value={totals.contacts.toLocaleString("es-MX")}
          helper="Personas registradas."
        />
        <StatCard
          label="Cuestionarios completados"
          value={totals.questionnairesCompleted.toLocaleString("es-MX")}
          helper="Ya cerraron el formulario."
        />
        <StatCard
          label="Con enlace de invitación"
          value={totals.contactsWithInviteToken.toLocaleString("es-MX")}
          helper="Llegaron por un enlace personalizado."
        />
        <StatCard
          label="Conferencistas activos"
          value={`${totals.speakersActive} / ${totals.speakers}`}
          helper="Activos del total en catálogo."
        />
        <StatCard
          label="Matches guardados"
          value={totals.clientMatches.toLocaleString("es-MX")}
          helper="Propuestas de afinidad generadas."
        />
        <StatCard
          label="Preguntas activas"
          value={totals.activeMatchSteps.toLocaleString("es-MX")}
          helper="Preguntas del cuestionario en uso."
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Tabla de últimos contactos */}
        <article className="animate-fade-slide-in rounded-2xl border border-black/10 bg-white p-6 shadow-sm [animation-delay:80ms] lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-xl font-extrabold text-black">Últimos contactos</h2>
            <Link
              href="/admin/clientes"
              className="text-micro font-semibold uppercase tracking-widest text-black/55 transition hover:text-black"
            >
              Ver todos →
            </Link>
          </div>
          <div className="mt-4 overflow-x-auto rounded-xl border border-black/10">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 bg-black/2 text-micro font-black uppercase tracking-widest text-black/45">
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Origen</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acción</th>
                </tr>
              </thead>
              <tbody>
                {recentContacts.map((c) => (
                  <tr key={c.id} className="border-b border-black/5 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <AvatarInitials name={c.fullName.trim() || "?"} />
                        <div className="min-w-0">
                          <p className="font-semibold text-black">{c.fullName || "—"}</p>
                          <p className="text-xs text-black/50">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full border border-black/10 bg-black/2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black/80">
                        {c.originChannelLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex max-w-[200px] rounded-full px-2 py-0.5 text-[10px] font-bold leading-snug ${c.statusBadgeClass}`}>
                        {c.statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/clientes/${c.id}`}
                        className="inline-flex rounded-full border border-black/15 bg-white px-3 py-1 text-micro font-semibold uppercase tracking-wider text-black transition hover:bg-black/5"
                      >
                        Detalle
                      </Link>
                    </td>
                  </tr>
                ))}
                {recentContacts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-black/50">
                      Aún no hay contactos.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        {/* Tarjetas de estado del embudo */}
        <article className="animate-fade-slide-in flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-6 shadow-sm [animation-delay:120ms]">
          <div>
            <h2 className="font-heading text-xl font-extrabold text-black">Estado del embudo</h2>
            <p className="mt-1 text-sm text-black/55">
              Distribución de contactos por etapa. Click para ver el listado filtrado.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/admin/clientes?status=sin_ingresar"
              className="group flex flex-col gap-1 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-400"
            >
              <p className="font-heading text-3xl font-extrabold tabular-nums text-slate-700">
                {statusCounts.sinIngresar.toLocaleString("es-MX")}
              </p>
              <p className="text-xs font-bold text-slate-600">Sin ingresar</p>
            </Link>
            <Link
              href="/admin/clientes?status=en_proceso"
              className="group flex flex-col gap-1 rounded-xl border border-sky-200 bg-sky-50 p-4 transition hover:border-sky-400"
            >
              <p className="font-heading text-3xl font-extrabold tabular-nums text-sky-800">
                {statusCounts.enProceso.toLocaleString("es-MX")}
              </p>
              <p className="text-xs font-bold text-sky-700">En proceso</p>
            </Link>
            <Link
              href="/admin/clientes?status=completo_sin_cita"
              className="group flex flex-col gap-1 rounded-xl border border-amber-200 bg-amber-50 p-4 transition hover:border-amber-400"
            >
              <p className="font-heading text-3xl font-extrabold tabular-nums text-amber-800">
                {statusCounts.completoSinCita.toLocaleString("es-MX")}
              </p>
              <p className="text-xs font-bold text-amber-700">Completo · sin cita</p>
            </Link>
            <Link
              href="/admin/clientes?status=agendado"
              className="group flex flex-col gap-1 rounded-xl border border-emerald-200 bg-emerald-50 p-4 transition hover:border-emerald-400"
            >
              <p className="font-heading text-3xl font-extrabold tabular-nums text-emerald-800">
                {statusCounts.agendado.toLocaleString("es-MX")}
              </p>
              <p className="text-xs font-bold text-emerald-700">Agendado</p>
            </Link>
          </div>
          <Link
            href="/admin/clientes"
            className="mt-auto inline-flex items-center justify-center rounded-xl border border-black/15 bg-black px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95"
          >
            Ver todos los clientes →
          </Link>
        </article>
      </div>
    </section>
  );
}
