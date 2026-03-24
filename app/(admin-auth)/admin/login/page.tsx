import Link from "next/link";
import { redirect } from "next/navigation";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { getAdminSessionFromCookies } from "@/lib/admin/session";

export default async function AdminLoginPage() {
  const session = await getAdminSessionFromCookies();
  if (session) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Acceso</p>
        <h1 className="mt-2 font-heading text-3xl font-extrabold text-slate-900">Administración</h1>
        <p className="mt-2 text-sm text-slate-600">Ingresa con tu cuenta de administrador.</p>

        <AdminLoginForm />

        <div className="mt-4 text-center text-sm text-slate-500">
          <Link href="/admin" className="font-semibold text-slate-800 hover:underline">
            Volver al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
