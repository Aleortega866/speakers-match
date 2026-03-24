import AdminSpeakersCatalog from "@/components/admin/AdminSpeakersCatalog";
import { getAdminSpeakersKpis, listAdminSpeakers } from "@/lib/admin/speakers";

export const metadata = {
  title: "Conferencistas · Admin",
};

export default async function AdminSpeakersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; pageSize?: string }>;
}) {
  const params = await searchParams;

  try {
    const [result, kpis] = await Promise.all([listAdminSpeakers(params), getAdminSpeakersKpis(params.search)]);

    return (
      <AdminSpeakersCatalog
        result={result}
        kpis={kpis}
        search={params.search ?? ""}
        pageSize={params.pageSize ?? "20"}
      />
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Error cargando conferencistas admin:", error);
    }

    return (
      <section className="space-y-6 font-body text-black">
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <p className="text-micro font-black uppercase tracking-widest text-amber-800">Conexión a base de datos</p>
          <h2 className="mt-2 font-heading text-2xl font-extrabold text-amber-950">No se pudo cargar conferencistas</h2>
          <p className="mt-2 text-sm text-amber-900">Verifica `DATABASE_URL` en tu `.env` y reinicia el servidor de desarrollo.</p>
        </div>
      </section>
    );
  }
}
