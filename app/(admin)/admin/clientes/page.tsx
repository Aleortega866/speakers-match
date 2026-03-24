import Link from "next/link";
import AvatarInitials from "@/components/admin/AvatarInitials";
import { getAdminClientsKpis, listAdminClients } from "@/lib/admin/clients";
import { StatCard } from "@/components/admin/AdminCards";
import type { ContactStatus } from "@/lib/admin/types";

const STATUS_TABS: Array<{ label: string; value: ContactStatus | "todos" }> = [
  { label: "Todos", value: "todos" },
  { label: "Sin ingresar", value: "sin_ingresar" },
  { label: "En proceso", value: "en_proceso" },
  { label: "Completo sin cita", value: "completo_sin_cita" },
  { label: "Agendado", value: "agendado" },
];

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; pageSize?: string; status?: string }>;
}) {
  const params = await searchParams;
  try {
    const [result, kpis] = await Promise.all([
      listAdminClients(params),
      getAdminClientsKpis(params.search),
    ]);

    const activeStatus = params.status ?? "todos";

    // Construir href de tab preservando search si existe
    function tabHref(value: ContactStatus | "todos") {
      const qs = new URLSearchParams();
      if (params.search?.trim()) qs.set("search", params.search.trim());
      if (value !== "todos") qs.set("status", value);
      const q = qs.toString();
      return `/admin/clientes${q ? `?${q}` : ""}`;
    }

    const kpiCount: Record<ContactStatus | "todos", number> = {
      todos: result.total,
      sin_ingresar: kpis.sinIngresar,
      en_proceso: kpis.enProceso,
      completo_sin_cita: kpis.completoSinCita,
      agendado: kpis.agendado,
    };

    return (
      <section className="space-y-6 font-body text-black">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-micro font-black uppercase tracking-widest text-black/50">Clientes</p>
          <h1 className="mt-2 font-heading text-3xl font-extrabold text-black md:text-4xl">Tus contactos</h1>
          <p className="mt-2 text-sm text-black/65 sm:text-base">
            Listado de contactos con búsqueda, filtro por estado y acceso al detalle.
          </p>
        </div>

        {/* KPIs por estado */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Sin ingresar"
            value={kpis.sinIngresar.toLocaleString("es-MX")}
            helper="Invitados que no han abierto el formulario."
          />
          <StatCard
            label="En proceso"
            value={kpis.enProceso.toLocaleString("es-MX")}
            helper="Iniciaron pero no completaron el cuestionario."
          />
          <StatCard
            label="Completo sin cita"
            value={kpis.completoSinCita.toLocaleString("es-MX")}
            helper="Completaron el formulario, falta agendar."
          />
          <StatCard
            label="Agendado"
            value={kpis.agendado.toLocaleString("es-MX")}
            helper="Completaron y agendaron en Calendly."
          />
        </div>

        <p className="text-sm text-black/55">
          Mostrando página {result.page} ({result.pageSize} filas por página)
          {result.hasNext ? " — hay más en las siguientes páginas." : " — no hay más páginas."}
        </p>

        <div className="rounded-2xl border border-black/10 bg-white shadow-sm">
          {/* Buscador + tabs de filtro */}
          <div className="space-y-4 border-b border-black/10 px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-heading text-xl font-bold text-black">Lista de clientes</h3>
              <form className="flex items-center gap-2" action="/admin/clientes" method="get">
                {params.status && params.status !== "todos" && (
                  <input type="hidden" name="status" value={params.status} />
                )}
                <input
                  type="text"
                  name="search"
                  defaultValue={params.search ?? ""}
                  placeholder="Buscar por nombre, email o empresa"
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

            {/* Tabs de estado */}
            <div className="flex flex-wrap gap-2">
              {STATUS_TABS.map((tab) => {
                const isActive = activeStatus === tab.value;
                const count = kpiCount[tab.value];
                return (
                  <Link
                    key={tab.value}
                    href={tabHref(tab.value)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition ${
                      isActive
                        ? "bg-black text-white"
                        : "border border-black/20 text-black/70 hover:bg-black/5"
                    }`}
                  >
                    {tab.label}
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black tabular-nums ${
                      isActive ? "bg-white/20 text-white" : "bg-black/8 text-black/60"
                    }`}>
                      {count}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full">
              <thead>
                <tr className="border-b border-black/10 bg-black/2 text-left text-micro font-black uppercase tracking-widest text-black/45">
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Empresa</th>
                  <th className="px-4 py-3">Origen</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Respuestas</th>
                  <th className="px-4 py-3">Acción</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((item) => (
                  <tr key={item.id} className="border-b border-black/5 text-sm text-black/90 last:border-0">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <AvatarInitials name={item.fullName.trim() || "?"} />
                        <div className="min-w-0">
                          <p className="font-semibold text-black">{item.fullName || "Sin nombre"}</p>
                          <p className="text-xs text-black/50">{item.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-black/80">{item.company || "—"}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full border border-black/10 bg-black/2 px-2.5 py-1 text-xs font-bold text-black/85">
                        {item.originChannelLabel}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex max-w-[220px] rounded-full px-2.5 py-1 text-xs font-bold leading-snug ${item.statusBadgeClass}`}>
                        {item.statusLabel}
                      </span>
                      {item.completedAt ? (
                        <span className="mt-1 block text-[10px] text-black/45">
                          Cierre: {item.completedAt.toLocaleDateString("es-MX")}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 tabular-nums text-black/80">{item.answersCount}</td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/admin/clientes/${item.id}`}
                        className="inline-flex rounded-lg border border-black/15 px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-black/5"
                      >
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
                {result.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-black/50">
                      No hay clientes para esta búsqueda.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Error cargando clientes admin:", error);
    }

    return (
      <section className="space-y-6 font-body text-black">
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <p className="text-micro font-black uppercase tracking-widest text-amber-800">Conexion a base de datos</p>
          <h2 className="mt-2 font-heading text-2xl font-extrabold text-amber-950">No se pudo cargar clientes</h2>
          <p className="mt-2 text-sm text-amber-900">Verifica `DATABASE_URL` en tu `.env` y reinicia `pnpm run dev`.</p>
          <p className="mt-2 text-xs text-amber-800">Detalle tecnico disponible en logs del servidor.</p>
        </div>
      </section>
    );
  }
}
