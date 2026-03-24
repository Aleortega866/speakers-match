import Link from "next/link";
import { notFound } from "next/navigation";
import CopyUrlButton from "@/components/admin/CopyUrlButton";
import { buildContactFlowDisplay } from "@/lib/admin/contactFlow";
import { getAdminClientDetail } from "@/lib/admin/clients";
import ClientMatches from "@/components/admin/clients/ClientMatches";
import { inviteStartUrl } from "@/lib/site";

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clientId = Number(id);
  if (!Number.isFinite(clientId)) notFound();

  const client = await getAdminClientDetail(clientId);
  if (!client) notFound();

  const firstName = client.fullName.trim().split(/\s+/)[0] ?? "Cliente";
  const answerCount = client.answers.length;
  const flow = buildContactFlowDisplay({
    token: client.token,
    origen: client.origin,
    form_started_at: client.form_started_at,
    form_completed_at: client.completedAt,
    calendly_booked_at: client.calendly_booked_at,
  });

  const inviteUrl = client.token ? inviteStartUrl(client.token) : null;

  return (
    <section className="space-y-6 font-body text-black">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/clientes"
          className="btn-primary-typo inline-flex items-center rounded-full border border-black/10 bg-white px-4 py-2 text-sm tracking-wide text-black transition hover:-translate-y-0.5 hover:shadow-sm"
        >
          ← Volver a clientes
        </Link>
      </div>

      <article className="animate-fade-slide-in rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-micro font-body font-black uppercase tracking-widest text-black/50">
              Cliente #{client.id}
            </p>
            <h1 className="mt-2 font-heading text-3xl font-extrabold leading-none text-black md:text-4xl">
              {client.fullName}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-black/10 bg-black/2 px-3 py-1.5 text-micro font-black uppercase tracking-widest text-black/80">
              {flow.originChannelLabel}
            </span>
            <span
              className={`rounded-full px-3 py-1.5 text-micro font-body font-black uppercase tracking-widest ${flow.statusBadgeClass}`}
            >
              {flow.statusLabel}
            </span>
            {client.completedAt ? (
              <span className="rounded-full border border-black/10 bg-black/2 px-3 py-1.5 text-micro font-body font-semibold uppercase tracking-widest tabular-nums text-black/45">
                Cierre {client.completedAt.toLocaleDateString("es-MX")}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Meta label="Empresa" value={client.company || "—"} />
          <Meta label="Email" value={client.email} />
          <Meta label="Fecha evento" value={client.eventDate || "—"} />
          <Meta label="Origen" value={flow.originDb} />
        </div>

        {inviteUrl ? (
          <div className="mt-4 rounded-2xl border border-dashed border-black/15 bg-black/2 p-4">
            <p className="text-micro font-black uppercase tracking-widest text-black/45">Enlace de invitación</p>
            <p className="mt-2 break-all font-mono text-xs leading-relaxed text-black/70">{inviteUrl}</p>
            <div className="mt-3">
              <CopyUrlButton url={inviteUrl} />
            </div>
          </div>
        ) : null}
      </article>

      <article className="animate-fade-slide-in rounded-2xl border border-black/10 bg-white p-6 shadow-sm [animation-delay:80ms]">
        <h2 className="font-heading text-2xl font-extrabold leading-none text-black md:text-3xl">
          Respuestas de <span className="text-black/80">{firstName}</span>
        </h2>
        <p className="mt-2 text-sm text-black/65 sm:text-base">
          Lo que respondió en el cuestionario.
        </p>
        {client.answers.length === 0 ? (
          <p className="mt-4 text-sm text-black/60">Este cliente no tiene respuestas registradas.</p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
            {client.answers.map((answer, index) => (
              <div
                key={`${answer}-${index}`}
                className="rounded-2xl border border-black/10 bg-white px-4 py-4 shadow-sm"
              >
                <p className="text-micro font-body font-black uppercase tracking-widest text-black/45">
                  Pregunta {index + 1}
                </p>
                <p className="mt-2 text-sm font-semibold leading-snug text-black">{answer}</p>
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="space-y-4 animate-fade-slide-in [animation-delay:160ms]">
        <div>
          <h2 className="font-heading text-2xl font-extrabold leading-none text-black md:text-3xl">
            Conferencistas recomendados
          </h2>
          <p className="mt-2 text-sm text-black/65 sm:text-base">
            Propuestas ordenadas por afinidad ({client.matches.length}).
          </p>
        </div>
        <ClientMatches matches={client.matches} />
      </article>

      <div className="flex flex-wrap justify-end gap-3 pb-2">
        <button
          type="button"
          disabled
          className="btn-primary-typo cursor-not-allowed rounded-full border border-black/10 bg-black/5 px-6 py-3 text-sm tracking-wide text-black/40"
          title="Pendiente de export PDF"
        >
          Descargar reporte de match
        </button>
      </div>
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-black/2 px-4 py-3">
      <p className="text-micro font-body font-black uppercase tracking-widest text-black/45">{label}</p>
      <p className="mt-1 text-sm font-semibold text-black">{value}</p>
    </div>
  );
}
