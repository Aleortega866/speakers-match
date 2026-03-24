export function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/50">{label}</p>
      <p className="mt-2 text-2xl font-heading font-extrabold text-black">{value}</p>
      <p className="mt-1 text-sm text-black/55">{helper}</p>
    </article>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-black/20 bg-white p-10 text-center">
      <h3 className="font-heading text-xl font-bold text-black">{title}</h3>
      <p className="mt-2 text-sm text-black/60">{description}</p>
    </div>
  );
}
