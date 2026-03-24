import Link from "next/link";
import AdminLogoutButton from "@/components/admin/AdminLogoutButton";
import AdminNav from "@/components/admin/AdminNav";

export default function AdminShell({
  children,
  userEmail,
}: Readonly<{
  children: React.ReactNode;
  userEmail: string;
}>) {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(148,163,184,0.18),transparent_55%)] bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/85 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-5 py-4 sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6 lg:min-w-0 lg:flex-1">
              <Link
                href="/admin"
                className="inline-flex shrink-0 items-center gap-3 transition hover:opacity-90"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm ring-1 ring-slate-900/10">
                  <span className="font-heading text-sm font-bold">SM</span>
                </div>
                <div className="min-w-0">
                  <p className="font-heading text-[11px] uppercase tracking-[0.2em] text-slate-500">Backoffice</p>
                  <p className="font-heading text-lg font-extrabold leading-tight tracking-tight text-slate-900">
                    SpeakerMatch
                  </p>
                </div>
              </Link>
              <AdminNav />
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200/80 pt-3 sm:border-0 sm:pt-0 lg:shrink-0">
              <span
                className="hidden max-w-[220px] truncate text-xs text-slate-500 md:inline"
                title={userEmail}
              >
                {userEmail}
              </span>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                Administrador
              </div>
              <AdminLogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 sm:py-8">{children}</main>
    </div>
  );
}
